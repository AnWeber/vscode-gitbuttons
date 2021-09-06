/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

const got = require('got');
const fs = require('fs').promises;


(async function generate() {

  try {
    const path = './package.json';
    const body = await got('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/git/package.json').json();


    const packageJson = JSON.parse(await fs.readFile(path, 'utf-8'));


    const { commands } = packageJson.contributes;

    const gitCommands = body.contributes.commands
      .filter(obj => obj.command.split('.').length < 3)
      .map(obj => {
        const result = {
          title: obj.command,
          command: obj.command.replace('git', 'git-buttons'),
          category: 'Git Buttons',
        };
        result.icon = commands.find(c => c.command === result.command)?.icon || '$(question)';
        return result;
      });

    packageJson.contributes.commands = [
      {
        'title': 'Pull Context',
        'command': 'git-buttons.pullContext',
        'category': 'Git Buttons',
        'icon': '$(arrow-down)'
      },
      {
        'title': 'Push Context',
        'command': 'git-buttons.pushContext',
        'category': 'Git Buttons',
        'icon': '$(arrow-up)'
      },
      ...gitCommands
    ];

    packageJson.contributes.menus['scm/title'] = [
      {
        'command': 'git-buttons.pullContext',
        'when': 'gitOpenRepositoryCount > 1 && config.git-buttons.pullContext',
        'group': 'navigation@2'
      },
      {
        'command': 'git-buttons.pushContext',
        'when': 'gitOpenRepositoryCount > 1 && config.git-buttons.pushContext',
        'group': 'navigation@3'
      },
      ...gitCommands.map((obj, index) => ({
        when: `scmProvider == git && config.${obj.command}`,
        command: obj.command,
        'group': `navigation@${index + 4}`
      }))];

    packageJson.contributes.menus.commandPalette = packageJson.contributes.menus['scm/title']
      .map(obj => ({
        command: obj.command,
        when: 'false',
      }));

    packageJson.contributes.configuration[0].properties['git-buttons'].default = packageJson.contributes.commands
      .reduce((acc, curr) => {
        acc[curr.command.slice('git-buttons.'.length)] = false;
        return acc;
      }, {});

    packageJson.contributes.configuration[0].properties['git-buttons'].properties = packageJson.contributes.commands
      .reduce((acc, curr) => {
        acc[curr.command.slice('git-buttons.'.length)] = {
          'type': 'boolean',
          'default': false,
          'description': curr.title
        };

        return acc;
      }, {});

    await fs.writeFile(path, JSON.stringify(packageJson, null, 4));

  } catch (error) {
    console.log(error);
  }

}());
