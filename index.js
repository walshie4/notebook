const cli      = require('commander');
const crypto   = require('crypto');
const readline = require('readline');
const fs       = require('fs');
const path     = require('path');

cli
  .version(require('./package').version)
  .option('-v, --verbose', 'Verbose logging')
  .option('-l --list', 'List notes')
  .parse(process.argv);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Set up
 */

if (cli.verbose) console.log('Starting up.');

const outputDir = process.env.WRITE_DIR || path.join(process.env.HOME, 'writeLandOuput');
if (!fs.existsSync(outputDir)) {
  if (cli.verbose) console.log(`Output dir not found creating at ${outputDir}`);
  fs.mkdirSync(outputDir);
}

const keyFile = process.env.WRITE_ENC_KEY || path.join(outputDir, '.writeLandKey');
let key;

rl.question('Enter encryption passphrase: ', (passwd) => {
  // First run, no key file
  if (!fs.existsSync(keyFile)) {
    crypto.randomBytes(4096, (err, buf) => {
      key = buf.toString('hex');
      const keyData = `Passwd:${key}dwssaP`;
      fs.writeFileSync(keyFile, encrypt(passwd, keyData), 'utf8');
    });
  } else {
    if (cli.verbose) console.log('Decrypting keyfile');
    const keyData = decrypt(passwd, fs.readFileSync(keyFile, 'utf8'));
    if (/^Passwd\:.*dwssaP$/.test(keyData)) {
      key = keyData.slice(7, -6);
    } else {
      console.log('Decrypting keyfile failed');
    }
  }
  // Key file exists
  rl.resume();
  parseOptions();
});

const parseOptions = () => {

  if (cli.verbose) console.log(`Using output dir ${outputDir}`);

  /**
  * Option parsing
  */

  if (cli.list) {
    // Decrypt and show entry
    if (cli.verbose) console.log('Reading output directory');
    // Read through save dir and list entries
    let notes = fs.readdirSync(outputDir);
    notes = notes.filter((note) => note !== '.writeLandKey');
    notes.forEach(function (note) {
      if (cli.verbose) console.log(`Reading note ${note}`);
      const fileData = fs.readFileSync(path.join(outputDir, note), 'utf8');
      console.log(decrypt(key, fileData));
    });
    rl.close();

  } else {
    // Take and save new entry
    rl.question('Enter new note: ', (resp) => {
      const outputPath = path.join(outputDir, new Date().toISOString());
      const data = encrypt(key, resp);
      if (cli.verbose) console.log(`Writing note ${data} to note file ${outputPath}`);
      fs.writeFileSync(outputPath, data, 'utf8');
      rl.close();
    });
  }
};

/**
 * Encryption helper functions
 */

const encrypt = function(keyStr, data) {
  const encKey = crypto.createHash('sha256')
              .update(keyStr)
              .digest();
  cipher = crypto.createCipheriv('aes256', encKey, encKey.slice(0, 16));
  cipher.end(data, 'utf8');
  return cipher.read().toString('base64');
};

const decrypt = function(keyStr, data) {
  const encKey = crypto.createHash('sha256')
              .update(keyStr)
              .digest();
  decipher = crypto.createDecipheriv('aes256', encKey, encKey.slice(0, 16));
  decipher.end(data, 'base64');
  return decipher.read().toString('utf8');
};
