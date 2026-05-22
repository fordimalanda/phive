# Contributing to Phive

Thank you for your interest in Phive. This project is governed by the FomaDev Public License (FPL). By contributing to this repository, you agree to adhere to the terms described below and accept that your contributions will be bound by the same licensing terms.

## Licensing and Compliance

Before submitting any code, please note the following essential rules regarding the FomaDev Public License (FPL):

1. **Official Integration Only**: Forks are authorized exclusively for the purpose of contributing to the official FomaDev repository. Maintaining separate, standalone, or permanent forks to bypass FomaDev authority is strictly prohibited.
2. **IP Ownership**: By submitting a Pull Request, you agree to grant FomaDev full rights to integrate, modify, and distribute your code under the FPL.
3. **Commercial Restrictions**: Modified versions of this extension or its source code cannot be redistributed, resold, or republished on any marketplace or platform without an explicit commercial license from FomaDev.

## How to Contribute

### Reporting Bugs or Requesting Features

If you encounter a bug or have an idea for an improvement, please open an Issue on GitHub rather than writing code immediately. 

When opening an issue, ensure you provide:
* A clear and descriptive title.
* A detailed description of the bug or feature request.
* Steps to reproduce the issue (for bugs), along with actual and expected behaviors.
* Your environment details (VS Code version, PHP version, Operating System).

### Submitting a Pull Request (PR)

To submit code modifications, please follow this rigorous process:

1. **Fork the Repository**: Create a temporary fork of the official repository to work on your modifications.

2. **Create a Feature Branch**: Branch out from the main branch using a clear naming convention:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   or
   ```bash
   git checkout -b fix/your-bug-fix
   ```

3. **Write Clean Code**: Ensure your TypeScript code complies with the project's configurations (`tsconfig.json` and production building constraints). Code should be modular, self-documented, and properly structured.

4. **Test Manually**: Run and test the extension within the VS Code Extension Development Host to ensure that features work seamlessly and that no performance regressions are introduced.

5. **Commit Changes**: Write concise, imperative commit messages describing exactly what has changed:
    ```bash
    git commit -m "Fix port finder collision logic on non-standard networks"
    ```

6. **Push and Open PR**: Push your branch to your temporary fork and open a Pull Request against the official FomaDev main branch.

### Pull Request Review Process

Every Pull Request will undergo manual review by FomaDev. Pull Requests will be evaluated based on:

* Strict compliance with the architectural integrity of the Phive engine.

* Code safety and security (ensuring no arbitrary execution or data leakage).

* Code cleanliness and performance metrics (minimizing the extension's bundle footprint).

FomaDev reserves the right to request adjustments, rewrite portions of the submitted code, or reject Pull Requests that do not align with the long-term roadmap of the project.

## Support and Inquiries

For inquiries regarding custom commercial licensing, derivative product authorizations, or specific implementation rights, please contact Fordi (FomaDev) directly through the contact details provided in the official documentation.