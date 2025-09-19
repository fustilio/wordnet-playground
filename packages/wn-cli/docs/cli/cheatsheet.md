# WordNet CLI Cheatsheet

A quick reference guide for common TUI controls and CLI commands.

## TUI Navigation & Controls

| Keys                | Action                             |
|---------------------|------------------------------------|
| **Arrow Keys**      | Navigate menus and lists           |
| **Enter**           | Select or confirm                  |
| **Escape**          | Go back or cancel                  |
| **Tab**             | Switch between sections/panes      |
| **Q**               | Quit the application               |
| **H**               | Show the help screen               |
| **Ctrl+D**          | Toggle the debug panel             |
| **1-8**             | Quick access to main menu items    |

## Common CLI Commands

This table covers the most frequent use cases for researchers, developers, and writers.

| Use Case                       | Command                                               | Example                                                     |
|--------------------------------|-------------------------------------------------------|-------------------------------------------------------------|
| **Setup & Installation**       |                                                       |                                                             |
| List available projects        | `data list`                                           | `wn-cli data list`                                          |
| Download a project             | `data download <project-id:version>`                  | `wn-cli data download oewn:2024 --progress`                 |
| Add a downloaded resource      | `data add <file>`                                     | `wn-cli data add oewn-2024-english-wordnet-2024.xml.gz`     |
|                                |                                                       |                                                             |
| **Basic Queries**              |                                                       |                                                             |
| Look up a word                 | `query word <word> [pos]`                             | `wn-cli query word "happy" a`                               |
| Find synonyms & alternatives   | `query synonyms <word> [pos]`                         | `wn-cli query synonyms "run" v`                             |
| Get simple definitions         | `query explain <word> [pos]`                          | `wn-cli query explain "bank" n`                             |
| Explore synsets & relations    | `query synset <word> [pos]`                           | `wn-cli query synset "computer" n --verbose`                |
|                                |                                                       |                                                             |
| **Advanced Queries**           |                                                       |                                                             |
| Word sense disambiguation      | `disambiguation <word> [pos]`                         | `wn-cli disambiguation "bank" n --include-examples`         |
| Cross-language search          | `multilingual <word> [pos]`                           | `wn-cli multilingual "computer" --target fr`                |
|                                |                                                       |                                                             |
| **Data & System Management**   |                                                       |                                                             |
| Check database & cache status  | `db status`                                           | `wn-cli db status --verbose`                                |
| Clean up cache                 | `db clean`                                            | `wn-cli db clean --dry-run`                                 |
| View usage logs                | `db logs`                                             | `wn-cli db logs --tail 10`                                  |
| List installed/available data  | `lexicons`                                            | `wn-cli lexicons --installed`                               |
| Export data                    | `data export --format <fmt>`                          | `wn-cli data export --format csv --output data.csv`         |
| Remove an installed lexicon    | `data remove <id> --force`                            | `wn-cli data remove oewn --force`                           |
| View or change config          | `config`                                              | `wn-cli config --set enableUsageLogging=true`               |
| Force reset config             | `config force-reset`                                  | `wn-cli config force-reset`                                 |
| Prepare browser data for web   | `browser prep --lexicon <id> [--outDir <dir>]`        | `wn-cli browser prep --lexicon oewn --outDir ../wn-ts-web/data` |
| Show database statistics       | `stats`                                               | `wn-cli stats --lexicon oewn --json`                        |
| Test layout system             | `layout-test`                                         | `wn-cli layout-test --snapshot`                             |

## TUI Automation (`--chain`)

Script TUI flows from the command line for testing or automation. Pass a series of commands to the `--chain` flag.

```bash
# Navigate to Word Search, type "hello", and exit
pnpm cli --tui --chain "down enter h e l l o enter q"

# Navigate through menus
pnpm cli --tui --chain "down down enter up right q"
```

**Supported Chain Commands**: `up`, `down`, `left`, `right`, `enter`, `esc`, `tab`, `backspace`, `q`, `h`, and any single character for text input.

## Development Commands

| Task                  | Command                 |
|-----------------------|-------------------------|
| Build the project     | `pnpm build`            |
| Run all CLI tests     | `pnpm test:cli`         |
| Run component tests   | `pnpm test:component`   |
| Check for type errors | `pnpm type-check`       |
| Lint the code         | `pnpm lint`             |
| Debug the TUI         | `pnpm debug:tui`        |
| Debug the CLI         | `pnpm debug:cli`        |
