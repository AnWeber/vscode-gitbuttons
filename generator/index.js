/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs').promises;


(async function generate() {

  try {
    const path = './package.json';
    const body = await (await import('got')).got('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/git/package.json').json();


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
      }).sort((obj1, obj2) => {
        if (obj1.command < obj2.command) {
          return -1;
        }
        if (obj1.command > obj2.command) {
          return 1;
        }
        return 0;
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

    packageJson.contributes.menus['scm/title'] = createTitleMenuEntries(gitCommands, 'git-buttons', '');
    packageJson.contributes.menus['view/title'] = createTitleMenuEntries(gitCommands, 'git-buttons-fileview', 'view == workbench.explorer.fileView && ');

    hideCommandsInCommandPalette(packageJson);
    addConfigurationJson(packageJson.contributes.configuration[0].properties['git-buttons'], packageJson);
    addConfigurationJson(packageJson.contributes.configuration[0].properties['git-buttons-fileview'], packageJson);

    await fs.writeFile(path, JSON.stringify(packageJson, null, 4));

  } catch (error) {
    console.log(error);
  }

}());

function createTitleMenuEntries(gitCommands, configKey, whenCondition) {
  const commandPrefixLength = 'git-buttons.'.length;
  return [
    {
      'command': 'git-buttons.pullContext',
      'when': `${whenCondition}gitOpenRepositoryCount > 1 && config.${configKey}.pullContext`,
      'group': 'navigation@2'
    },
    {
      'command': 'git-buttons.pushContext',
      'when': `${whenCondition}gitOpenRepositoryCount > 1 && config.${configKey}.pushContext`,
      'group': 'navigation@3'
    },
    {
      'command': 'git-buttons.pull',
      'when': `${whenCondition}gitOpenRepositoryCount == 1 && config.${configKey}.pullContext || ${whenCondition}config.${configKey}.pull`,
      'group': 'navigation@2'
    },
    {
      'command': 'git-buttons.push',
      'when': `${whenCondition}gitOpenRepositoryCount == 1 && config.${configKey}.pushContext || ${whenCondition}config.${configKey}.push`,
      'group': 'navigation@3'
    },
    ...gitCommands
      .filter(obj => ['git-buttons.pull', 'git-buttons.push'].indexOf(obj.command) < 0)
      .map((obj, index) => ({
        command: obj.command,
        when: `${whenCondition}gitOpenRepositoryCount >= 1 && config.${configKey}.${obj.command.slice(commandPrefixLength)}`,
        'group': `navigation@${index + 4}`
      }))
  ];
}

function hideCommandsInCommandPalette(packageJson) {
  packageJson.contributes.menus.commandPalette = packageJson.contributes.commands
    .map(obj => ({
      command: obj.command,
      when: 'false',
    }));
}

function addConfigurationJson(configuration, packageJson) {
  const commandPrefixLength = 'git-buttons.'.length;
  configuration.default = packageJson.contributes.commands
    .reduce((acc, curr) => {
      acc[curr.command.slice(commandPrefixLength)] = false;
      return acc;
    }, {});

  configuration.properties = packageJson.contributes.commands
    .reduce((acc, curr) => {
      acc[curr.command.slice(commandPrefixLength)] = {
        'type': 'boolean',
        'default': false,
        'description': curr.title
      };

      return acc;
    }, {});
}
