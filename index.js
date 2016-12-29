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
 * Encryption helper functions
 */

function hiddenInput(question, cb) {
  let i       = 0;
  const onData = function(char) {
    process.stdin.resume();
    const charStr = char + '';
    switch (charStr) {
      case "\n":
      case "\r":
      case "\u0004":
        process.stdin.removeListener('data', onData);
        break;
      default:
        process.stdout.write("\033[2K\033[200D" + question + `[${(i%2===1) ? '=-' : '-='}]`);
        i += 1;
        break;
    }
  };

  process.stdin.on('data', onData);

  rl.question(question, function(value) {
    rl.history = rl.history.slice(1);
    cb(value);
  });
};

function encrypt(keyStr, data) {
  const encKey = crypto.createHash('sha256')
              .update(keyStr)
              .digest();
  cipher = crypto.createCipheriv('aes256', encKey, encKey.slice(0, 16));
  cipher.end(data, 'utf8');
  return cipher.read().toString('base64');
};

function decrypt(keyStr, data) {
  const encKey = crypto.createHash('sha256')
              .update(keyStr)
              .digest();
  decipher = crypto.createDecipheriv('aes256', encKey, encKey.slice(0, 16));
  decipher.end(data, 'base64');
  return decipher.read().toString('utf8');
};

/**
 * Start of execution
 */

if (cli.verbose) console.log('Starting up.');

const outputDir = process.env.WRITE_DIR || path.join(process.env.HOME, 'notebookOuput');
if (!fs.existsSync(outputDir)) {
  if (cli.verbose) console.log(`Output dir not found creating at ${outputDir}`);
  fs.mkdirSync(outputDir);
}

const keyFile = process.env.WRITE_ENC_KEY || path.join(outputDir, '.notebookKey');
let key;

hiddenInput('Enter encryption passphrase: ', function (passwd) {
  // First run, no key file
  if (!fs.existsSync(keyFile)) {
    crypto.randomBytes(4096, function (err, buf) {
      key = buf.toString('hex');
      const keyData = `Passwd:${key}dwssaP`;
      fs.writeFileSync(keyFile, encrypt(passwd, keyData), 'utf8');
    });
  } else {
    if (cli.verbose) console.log('Decrypting keyfile');
    const keyData = decrypt(passwd, fs.readFileSync(keyFile, 'utf8'));
    if (/^Passwd\:.*dwssaP$/.test(keyData)) {
      if (cli.verbose) console.log('Keyfile decrypted successfully');
      key = keyData.slice(7, -6);
    } else {
      console.log('Decrypting keyfile failed');
    }
  }
  // Key file exists
  rl.resume();
  parseOptions();
});

function parseOptions() {

  if (cli.verbose) console.log(`Using output dir ${outputDir}`);

  /**
  * Option parsing
  */

  if (cli.list) {
    // Decrypt and show entry
    if (cli.verbose) console.log('Reading output directory');
    // Read through save dir and list entries
    const files = fs.readdirSync(outputDir);
    const notes = files.filter(function (note) { return note !== '.notebookKey' });
    if (!notes.length) console.log(`No notes found @ ${outputDir}`);
    notes.forEach(function (note) {
      if (cli.verbose) console.log(`Reading note ${note}`);
      const fileData = fs.readFileSync(path.join(outputDir, note), 'utf8');
      if (cli.verbose) console.log(`Decrypting note from ${fileData}`);
      console.log(decrypt(key, fileData));
    });
    rl.close();
    process.exit(1);

  } else {
    // Take and save new entry
    rl.question('Enter new note: ', function (resp) {
      const outputPath = path.join(outputDir, new Date().toISOString());
      const data = encrypt(key, resp);
      if (cli.verbose) console.log(`Writing note ${data} to note file ${outputPath}`);
      fs.writeFileSync(outputPath, data, 'utf8');
      rl.close();
      process.exit(1);
    });
  }
};

