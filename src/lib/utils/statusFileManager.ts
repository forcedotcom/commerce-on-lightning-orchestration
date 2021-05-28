/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { fs } from '@salesforce/core';
import YAML from 'yaml';
import { BASE_DIR } from './constants/properties';
import { DevHubConfig } from './jsonUtils';
import { sleep } from './sleep';

/* eslint-disable jsdoc/check-indentation */
/**
 * This class manages the status file, it needs to work with many simultaneous threads
 * It will output to a yaml file
 * devhubs:
 *      ceo@mydevhub.com:
 *          created: done # maybe also add a description
 *          enabled: done
 *          authed: done
 *          scratchOrgs:
 *              demo@1commerce.com:
 *                  created:
 *                      failed:
 *                          - some reason it failed with error ect
 *              demo@2commerce.com:
 *                  created: done
 *                  ....
 */
/* eslint-disable jsdoc/check-indentation */
export class StatusFileManager {
  private readonly filePath: string;
  private readonly lockFile: string;
  private statusLock: boolean;
  private status: Status;

  public constructor(filePath: string = BASE_DIR + '/status.yaml') {
    this.filePath = filePath;
    this.lockFile = filePath + '.lock';
    try {
      fs.unlinkSync(this.lockFile);
    } catch (e) {
      /* DO NOTHING DON'T CARE IF IT DOESN'T EXIST*/
    }
    this.statusLock = false;
  }
  public getStatus(): Status {
    return this.status;
  }
  public async setStatus(status: Status): Promise<void> {
    this.statusLock = true;
    this.status = status;
    await this.save();
    this.statusLock = false;
  }

  /**
   * Sets a key value pair
   *
   * @param devHubConfig
   * @param position assumed to be (devhubusername=0, scratchorgusername=1, storename=2)
   * @param key
   * @param value
   */
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  public async setValue(devHubConfig: DevHubConfig, position: number, key: string, value: unknown): Promise<void> {
    while (this.statusLock) await sleep(100);
    await this.read();
    this.statusLock = true;
    if (!this.status) this.status = new Status();
    if (!this.status.devhubs) this.status.devhubs = {};
    if (!this.status.devhubs[devHubConfig.hubOrgAdminUsername])
      this.status.devhubs[devHubConfig.hubOrgAdminUsername] = new Devhub();
    if (position === 1) this.status.devhubs[devHubConfig.hubOrgAdminUsername][key] = value;
    if (position >= 2) {
      if (!this.status.devhubs[devHubConfig.hubOrgAdminUsername].scratchOrgs)
        this.status.devhubs[devHubConfig.hubOrgAdminUsername].scratchOrgs = {};
      if (!this.status.devhubs[devHubConfig.hubOrgAdminUsername].scratchOrgs[devHubConfig.scratchOrgAdminUsername])
        this.status.devhubs[devHubConfig.hubOrgAdminUsername].scratchOrgs[
          devHubConfig.scratchOrgAdminUsername
        ] = new ScratchOrg();
      if (position === 2)
        this.status.devhubs[devHubConfig.hubOrgAdminUsername].scratchOrgs[devHubConfig.scratchOrgAdminUsername][
          key
        ] = value;
      if (position === 3) {
        if (
          !this.status.devhubs[devHubConfig.hubOrgAdminUsername].scratchOrgs[devHubConfig.scratchOrgAdminUsername]
            .stores
        )
          this.status.devhubs[devHubConfig.hubOrgAdminUsername].scratchOrgs[
            devHubConfig.scratchOrgAdminUsername
          ].stores = {};
        if (
          !this.status.devhubs[devHubConfig.hubOrgAdminUsername].scratchOrgs[devHubConfig.scratchOrgAdminUsername]
            .stores[devHubConfig.storeName]
        )
          this.status.devhubs[devHubConfig.hubOrgAdminUsername].scratchOrgs[
            devHubConfig.scratchOrgAdminUsername
          ].stores[devHubConfig.storeName] = new Store();
        this.status.devhubs[devHubConfig.hubOrgAdminUsername].scratchOrgs[devHubConfig.scratchOrgAdminUsername].stores[
          devHubConfig.storeName
        ][key] = value;
      }
    }
    this.statusLock = false;
    await this.save();
  }
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  /**
   * gets a key value pair from the status file
   *
   * @param devHubConfig
   * @param type assumed to be (devhubusername=0, scratchorgusername=1, storename=2)
   * @param key the key to index off of
   */
  public async getValue(
    devHubConfig: DevHubConfig,
    type: Devhub | ScratchOrg | Store,
    key: string
  ): Promise<string | boolean | undefined> {
    while (this.statusLock) await sleep(100);
    await this.read();
    try {
      const d = this.status.devhubs[devHubConfig.hubOrgAdminUsername];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      if (type instanceof Devhub) return d[key] || undefined;
      const sc = d.scratchOrgs[devHubConfig.scratchOrgAdminUsername];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      if (type instanceof ScratchOrg) return sc[key] || undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      if (type instanceof Store) return sc.stores[devHubConfig.storeName][key] || undefined;
    } catch (e) {
      return undefined;
    }
  }

  private async save(): Promise<void> {
    // if lock file exists then wait
    while (fs.fileExistsSync(this.lockFile)) await sleep(100);
    fs.writeFileSync(this.lockFile, '');
    fs.writeFileSync(this.filePath, YAML.stringify(this.status));
    fs.unlinkSync(this.lockFile);
  }

  private async read(): Promise<void> {
    // if lock file exists then wait
    while (fs.fileExistsSync(this.lockFile)) await sleep(100);
    fs.writeFileSync(this.lockFile, '');
    // if the file doesn't exist create an empty one
    if (!fs.existsSync(this.filePath)) fs.writeFileSync(this.filePath, '');
    this.status = YAML.parse(fs.readFileSync(this.filePath, 'utf8')) as Status;
    fs.unlinkSync(this.lockFile);
  }
}

export const statusManager = new StatusFileManager();

class Status {
  public devhubs: Record<string, Devhub> = {};
}
export class Devhub {
  public scratchOrgs: Record<string, ScratchOrg> = {};
  public created: boolean;
  public hubOrgId: string;
  public enabled: boolean;
  public authed: boolean;
}
export class ScratchOrg {
  public created: boolean;
  public stores: Record<string, Store> = {};
}
export class Store {
  public id: string;
  public retrievedPackages: boolean;
  public integrationSetup: boolean;
  public memberListUpdatedCommunityActive: boolean;
  public adminUserMapped: boolean;
  public productsImported: boolean;
  public buyerGroupName: string;
  public accountId: string;
  public buyerUsername: string;
  public communityPublished: boolean;
  public pushedSources: boolean;
  public indexCreated: boolean;
  public done: boolean;
  public userInfo: UserInfo;
  public fullStoreUrl: string;
}
export class UserInfo {
  public accessToken: string;
  public id: string;
  public instanceUrl: string;
  public loginUrl: string;
  public orgId: string;
  public profileName: string;
  public username: string;
  public password: string;
}
