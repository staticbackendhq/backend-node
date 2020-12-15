# backend-node
Node client library for [StaticBackend](https://staticbackend.com)'s API.

## Install

```
$> npm i @staticbackend/backend
```

## Usage

You'll need a public key to use this library. Please refer to our 
[getting started guide](https://staticbackend.com/getting-started/) to help you get up and running.

### Importing and creating an instance

```javascript
import { Backend } from "@staticbackend/backend";
const bkn = new Backend("your-pub-key", "region");
```

Only the `na1` region is supported. Your public key will be sent after you create 
your account.

### Format

The function calls, say to create a database document (all every other functions) 
return the following:

`{ok: boolean, content: any}`

For successful requests the `ok` field will be `true` and the `content` filed will 
be what you expect from a successful call.

If an error occurs, the `ok` field will be `false` and the `content` field will 
contains the error message.

### Users registration and login

```javascript
const result = bkn.login("a@newuser.com", "pass123456");
if (result.ok) {
	console.log(result.content);
}
```

For `login` and `register` the `content` field contains the user's session `token`.

You'll need this token for all your interaction with the backend.

