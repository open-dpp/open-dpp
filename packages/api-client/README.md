<a href="https://open-dpp.de/" target="blank"><img src="https://open-dpp.de/wp-content/uploads/2024/11/Logo-with-text.png" width="200" alt="Nest Logo" /></a>

The open source platform for digital product passports.

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/open-dpp/open-dpp-api-client?utm_source=oss&utm_medium=github&utm_campaign=open-dpp%2Fopen-dpp-api-client&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

# Description

This repository contains a HTTP client for the REST API of our open-dpp platform.

# Usage Guide

## Installation

```bash
$ npm install @open-dpp/api-client
```

## Usage

Create a new instance of a client with the baseURL parameter directing to your API.

```typescript
const apiClient = new OpenDppApiClient({ baseURL: API_URL })
```

Set the ApiKey for the client to enable it to authenticate to your API.

```typescript
apiClient.setApiKey(token)
```

Use any function of the client. E.g., create an organization.

```typescript
async function addOrganization() {
  console.log('Creating organization...')
  const response = await apiClient.postOrganization({
    name: 'Test',
  })
  console.log('Finished creating an organization.')
  if (response.status === 201) {
    console.log('Successfully created an organization.')
  }
  else {
    console.error('Error on creating an organization.')
  }
}
```

# Development Guide

## Installation

```bash
$ npm install
```

## Deployment

1. Commit your current changed files for a clean working tree in the next step
2. Merge your changes on the main branch
3. Run ```npm run build``` to see if your code compiles
4. Run ```npm run test``` to see if your code fails
5. Determine whether you want to create a patch, minor or major version. Run the fitting npm scripts (e.g., npm run
   patch)
   1. This updates the version number in the package.json
   2. Also, a git tag is created for the version
   3. The git tag and current branch are pushed to GitHub
   4. First, the push triggers a workflow to create a new release in GitHub
   5. Finishing that workflow triggers another one to publish the release to npm
