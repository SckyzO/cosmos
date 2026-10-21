# Security policy

## Supported versions

Security fixes go into the latest release of each package:

- `@sckyzo/cosmos-theme`
- `@sckyzo/cosmos-react`
- `@sckyzo/cosmos-charts`

The packages are below 1.0, so there are no maintained older lines. Upgrade to the latest version to
get a fix.

## Reporting a vulnerability

Report it privately through GitHub:
[Report a vulnerability](https://github.com/SckyzO/cosmos/security/advisories/new) (Security tab of
the repository). Please don't open a public issue or pull request for it.

Include the package and version, what an attacker controls, and a minimal reproduction if you have
one. I'll confirm the report, work on a fix in a private fork, and publish a GitHub security
advisory with the fixed versions, crediting you unless you'd rather not be named.

## Scope

In scope: the three published packages and the Storybook site at
<https://sckyzo.github.io/cosmos/>. A vulnerability in a dependency belongs upstream; tell me too if
Cosmos exposes it in a way the upstream fix doesn't cover.
