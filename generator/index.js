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
    packageJson.contributes.commands = body.contributes.commands
      .map(obj => {
        const result = {
          title: obj.command,
          command: obj.command.replace('git', 'git-buttons'),
          category: 'Git Buttons',
        };
        result.icon = commands.find(c => c.command === result.command)?.icon || '$(question)';
        return result;
      });

    packageJson.contributes.menus['scm/title'] = packageJson.contributes.commands.map((obj, index) => ({
      when: `scmProvider == git && config.${obj.command}`,
      command: obj.command,
      'group': `navigation@${index}`
    }));

    packageJson.contributes.configuration[0].properties = packageJson.contributes.commands.reduce((acc, curr) => {

      acc[curr.command] = {
        'type': 'boolean',
        'default': true,
        'description': curr.title
      };

      return acc;
    }, {});

    await fs.writeFile(path, JSON.stringify(packageJson, null, 4));

  } catch (error) {
    console.log(error);
  }

}());
