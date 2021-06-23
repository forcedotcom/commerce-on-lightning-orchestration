/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { BASE_DIR, EXAMPLE_DIR } from '../../utils/constants/properties';

Messages.importMessagesDirectory(__dirname);

const TOPIC = 'examples';
const messages = Messages.loadMessages('commerce-orchestration', TOPIC);

export const exampleFlags = {
  'config-file': flags.filepath({
    char: 'f',
    default: EXAMPLE_DIR() + '/convert-these.txt',
    description: messages.getMessage('convertFlags.configFileDescription'),
  }),
  'output-dir': flags.string({
    char: 'o',
    default: BASE_DIR + '/force-app',
    description: messages.getMessage('convertFlags.outputDirDescription'),
  }),
  convert: flags.string({
    char: 'v',
    multiple: true,
    default: '',
    description: messages.getMessage('convertFlags.convertDescription'),
  }),
};
