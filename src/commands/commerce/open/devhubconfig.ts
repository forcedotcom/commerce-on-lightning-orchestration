/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { openFlags } from '../../../lib/flags/commerce/open.flags';
import { BASE_DIR } from '../../../lib/utils/constants/properties';
import { shell } from '../../../lib/utils/shell';

Messages.importMessagesDirectory(__dirname);

const TOPIC = 'open';
const CMD = `commerce:${TOPIC}:devhubconfig`;
const messages = Messages.loadMessages('commerce-orchestration', TOPIC);

export class OpenDevHubConfig extends SfdxCommand {
  public static description = messages.getMessage('devhubconfig.cmdDescription');

  public static examples = [`sfdx ${CMD} -e atom`];

  protected static flagsConfig = openFlags;

  // eslint-disable-next-line @typescript-eslint/require-await
  public async run(): Promise<AnyJson> {
    shell(`${this.flags.editor as string} ${BASE_DIR + '/devhub-configuration.json'}`);
    return { isOpened: true };
  }
}
