# Write Land

A tool to write and read encrypted notes

# Installing

0. Clone the repo `git clone git@github.com:walshie4/write-land.git`
1.  `npm i` or `yarn`
2. (Optional) - Setup aliases in your preferred terminal's `.*rc` file (`.bashrc`, `.zshrc`, etc.)
  I use the following

  `alias note='node ~/Developer/write-land/index.js'` and `alias notes='node ~/Developer/write-land/index.js -l'`
3. Run the program. (`node index.js`) See flags below for different functionality.

### Flags

`-v --verbose` - Run in verbose mode

`-l --list`    - Read and list notes that exist

Use no flags to create a new entry
