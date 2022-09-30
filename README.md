# Commerce Orchestration Plugin

---

This is 1 of 3 plugins to help setup a store.

This plugin will create and auth a scratchorg as the primary purpose then calls the commerce-on-lightning plugin to create a store.

[commerce-on-lightning-orchestration](https://github.com/forcedotcom/commerce-on-lightning-orchestration) - commerce-orchestration <---- THIS PLUGIN

- scratchorgs

[commerce-on-lightning](https://github.com/forcedotcom/commerce-on-lightning) - @salesforce/commerce

- store

[sfdx-1commerce-plugin](https://github.com/forcedotcom/sfdx-1commerce-plugin) - 1commerce

- API calls for product import and search index

---

# Table of Contents

<!-- toc -->

- [Commerce Orchestration Plugin](#commerce-orchestration-plugin)
- [Table of Contents](#table-of-contents)
- [How-to-Contribute](#how-to-contribute)
<!-- tocstop -->

<!-- install -->

## Install

<strong>Intended for most users</strong>

First install the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli).
Next install the commerce orchestration plugin

```
echo y | sfdx plugins:install git+ssh://git@github.com:forcedotcom/commerce-on-lightning-orchestration.git
```

Now, you can run the commerce commands.

```
sfdx commerce:setup
```

See below for the full list of commands.

### To run from local git repo:

<strong>Intended for plugin developers or people trying out a workaround and don't want to override their commerce sfdx plugin.</strong>

```
$ yarn install
$ bin/run commerce
```

### When you’re ready to test-drive your plug-in from local git repo, link your git repo to Salesforce CLI.

<strong>Intended for plugin developers or people trying out a workaround and want this to be their default for sfdx commerce commands</strong>
from inside the root of the git repo

```
sfdx plugins:link
```

<!-- installstop -->

## Commands

<!-- commands -->

- [`sfdx commerce:devhub:auth [-c <filepath>] [-F <filepath>] [-J] [-i <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-commercedevhubauth--c-filepath--f-filepath--j--i-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
- [`sfdx commerce:open:devhubconfig [-e <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-commerceopendevhubconfig--e-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
- [`sfdx commerce:scratchorg:create [-c <filepath>] [-a <string>] [-v <string>] [-u <string>] [-n <number>] [-p] [-g <string>] [-t <string>] [-y] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-commercescratchorgcreate--c-filepath--a-string--v-string--u-string--n-number--p--g-string--t-string--y---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
- [`sfdx commerce:setup [-c <filepath>] [-u <string>] [-s <string>] [-t <string>] [-n <integer>] [-m <integer>] [-o <string>] [-f <filepath>] [-y] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-commercesetup--c-filepath--u-string--s-string--t-string--n-integer--m-integer--o-string--f-filepath--y---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx commerce:devhub:auth [-c <filepath>] [-F <filepath>] [-J] [-i <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Authorize a devhub

```
Authorize a devhub

USAGE
  $ sfdx commerce:devhub:auth [-c <filepath>] [-F <filepath>] [-J] [-i <string>] [--json] [--loglevel
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -F, --server-cert=server-cert                                                     [default:
                                                                                    ~/.commerce/.certs/s
                                                                                    erver.crt] Server Cert file

  -J, --use-jwt                                                                     Use JWT to auth

  -c, --configuration=configuration                                                 [default:
                                                                                    ~/.commerce/devhub-c
                                                                                    onfiguration.json] Pass in config to
                                                                                    override default

  -i, --client-id=client-id                                                         Client Id for auth:web:login

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx commerce:devhub:auth --configuration devhub-configuration.json
```

_See code: [src/commands/commerce/devhub/auth.ts](https://github.com/forcedotcom/commerce-on-lightning-orchestration/blob/v238.0.4/src/commands/commerce/devhub/auth.ts)_

## `sfdx commerce:open:devhubconfig [-e <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Open devhub-configuration.json file

```
Open devhub-configuration.json file

USAGE
  $ sfdx commerce:open:devhubconfig [-e <string>] [--json] [--loglevel
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -e, --editor=editor                                                               [default: vi] Editor to open file
                                                                                    with

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx commerce:open:devhubconfig -e atom
```

_See code: [src/commands/commerce/open/devhubconfig.ts](https://github.com/forcedotcom/commerce-on-lightning-orchestration/blob/v238.0.4/src/commands/commerce/open/devhubconfig.ts)_

## `sfdx commerce:scratchorg:create [-c <filepath>] [-a <string>] [-v <string>] [-u <string>] [-n <number>] [-p] [-g <string>] [-t <string>] [-y] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Create a scratch org

```
Create a scratch org

USAGE
  $ sfdx commerce:scratchorg:create [-c <filepath>] [-a <string>] [-v <string>] [-u <string>] [-n <number>] [-p] [-g
  <string>] [-t <string>] [-y] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -a, --hub-org-admin-username=hub-org-admin-username                               [default: ceo@mydevhub.com] username
                                                                                    of the hub org admin

  -c, --configuration=configuration                                                 [default:
                                                                                    ~/.commerce/devhub-c
                                                                                    onfiguration.json] Pass in config to
                                                                                    override default

  -g, --scratch-org-alias=scratch-org-alias                                         [default: devhub] Alias name for
                                                                                    this scratch org

  -n, --scratch-org-number=scratch-org-number                                       Which store to create from config
                                                                                    file scratchOrgs list -1 for all
                                                                                    stores

  -p, --is-b2c-lite-access-perm-needed                                              Should the script run sfdx
                                                                                    force:org:open and wait for you to
                                                                                    save B2CLiteAccessPerm?

  -t, --type=type                                                                   [default: b2c] b2b or b2c

  -u, --scratch-org-admin-username=scratch-org-admin-username                       [default: demo@1commerce.com]
                                                                                    username of the admin to associate
                                                                                    with the scratch org.

  -v, --api-version=api-version                                                     [default: 52.0] Version of current
                                                                                    Salesforce

  -y, --prompt                                                                      If there is a file difference
                                                                                    detected in example files, prompt
                                                                                    before overwriting file

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx commerce:scratchorg:create --configuration devhub-configuration.json
```

_See code: [src/commands/commerce/scratchorg/create.ts](https://github.com/forcedotcom/commerce-on-lightning-orchestration/blob/v238.0.4/src/commands/commerce/scratchorg/create.ts)_

## `sfdx commerce:setup [-c <filepath>] [-u <string>] [-s <string>] [-t <string>] [-n <integer>] [-m <integer>] [-o <string>] [-f <filepath>] [-y] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Setup a devhub and scratch org from start to finish with one command

```
Setup a devhub and scratch org from start to finish with one command

USAGE
  $ sfdx commerce:setup [-c <filepath>] [-u <string>] [-s <string>] [-t <string>] [-n <integer>] [-m <integer>] [-o
  <string>] [-f <filepath>] [-y] [--json] [--loglevel
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --configuration=configuration                                                 [default:
                                                                                    ~/.commerce/devhub-c
                                                                                    onfiguration.json] Pass in config to
                                                                                    override default

  -f, --definitionfile=definitionfile                                               [default:
                                                                                    ~/.commerce/config/s
                                                                                    tore-scratch-def.json] store scratch
                                                                                    def

  -m, --store-number=store-number                                                   [default: -1] Index number for the
                                                                                    store to be created

  -n, --scratch-org-number=scratch-org-number                                       [default: -1] Which store to create
                                                                                    from config file scratchOrgs list -1
                                                                                    for all stores

  -o, --type=b2c|b2b|both                                                           [default: both] The type of store
                                                                                    you want to create

  -s, --scratch-org-store-name=scratch-org-store-name                               [default: 1commerce] Name of scratch
                                                                                    org store

  -t, --templatename=templatename                                                   [default: b2c-lite-storefront]
                                                                                    template to use to create a site

  -u, --scratch-org-admin-username=scratch-org-admin-username                       [default: demo@1commerce.com]
                                                                                    username of the admin to associate
                                                                                    with the scratch org.

  -y, --prompt                                                                      If there is a file difference
                                                                                    detected in example files, prompt
                                                                                    before overwriting file

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLES
  sfdx commerce:setup --configuration devhub-configuration.json
  sfdx commerce:setup
```

_See code: [src/commands/commerce/setup.ts](https://github.com/forcedotcom/commerce-on-lightning-orchestration/blob/v238.0.4/src/commands/commerce/setup.ts)_

<!-- commandsstop -->

# How-to-Contribute

Please see our [CONTRIBUTING](CONTRIBUTING.md) doc.
