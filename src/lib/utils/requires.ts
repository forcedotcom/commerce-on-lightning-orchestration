/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { fs, Messages, SfdxError } from '@salesforce/core';
import { checkConnection } from './checkConnection';
import { BASE_DIR, STATUS_FILE } from './constants/properties';
import { shellJsonSfdx } from './shell';

Messages.importMessagesDirectory(__dirname);
const msgs = Messages.loadMessages('commerce-orchestration', 'commerce');

/**
 * Builder pattern for command requirements or just call one method statically
 * order matters
 */
export class Requires {
  private commands: CMD[] = [];

  public static default(instanceURL: string): Requires {
    return new Requires(); // .serverRunning(instanceURL);
  }

  public static async serverRunning(instanceURL = 'http://localhost:6109'): Promise<void> {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    await checkConnection(instanceURL).catch((reason) => {
      throw new SfdxError(
        msgs.getMessage('requires.errorServerConnectionError', [instanceURL, JSON.stringify(reason)])
      );
    });
  }

  public static examplesConverted(dir: string = BASE_DIR, devhubConfig = '', storeName = '', force = 'false'): void {
    if (force === 'true' || !fs.existsSync(dir + '/force-app') || !fs.lstatSync(dir + '/force-app').isDirectory()) {
      if (fs.existsSync(dir + '/force-app') && !fs.lstatSync(dir + '/force-app').isDirectory())
        fs.unlinkSync(dir + '/force-app'); // this shouldn't happen, but if it does...
      if (!devhubConfig) shellJsonSfdx('sfdx commerce:examples:convert ' + '-o ' + dir);
      else shellJsonSfdx('sfdx commerce:examples:convert ' + '-o ' + dir + ' -c ' + devhubConfig + ' -s ' + storeName);
    }
  }

  public step(step: string, status = STATUS_FILE()): Requires {
    this.commands.push(new CMD('step', [step, status]));
    return this;
  }
  public serverRunning(instanceURL = 'http://localhost:6109'): Requires {
    this.commands.push(new CMD('serverRunning', [instanceURL]));
    return this;
  }
  public examplesConverted(dir: string = BASE_DIR, devhubConfig = '', storeName = '', force = 'false'): Requires {
    this.commands.push(new CMD('examplesConverted', [dir, devhubConfig, storeName, force]));
    return this;
  }
  public async build(): Promise<void> {
    for (const cmd of this.commands)
      switch (cmd.key) {
        case 'serverRunning':
          await Requires.serverRunning(...cmd.properties);
          break;
        case 'examplesConverted':
          Requires.examplesConverted(...cmd.properties);
          break;
      }
  }
}
class CMD {
  public key: string;
  public properties: string[];

  public constructor(key: string, properties: string[]) {
    this.key = key;
    this.properties = properties;
  }
}
