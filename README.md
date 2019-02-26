# Listr

This is a fancier version of my [existing grocery list app](https://github.com/caressingbeast/grocery-list). This one was built using Express and MongoDB on the backend and React on the frontend. It uses JWT tokens for authentication. I know I could've just used existing session authentication, but I wanted to play around with JWTs. This was also my first time building an authentication system in Node.

## Authentication

As stated above, the app uses JWTs for some nice stateless authentication. Tokens are actually stored in cookies using the `httpOnly` and `secure` (prod only) properties to lock them down as best I can. I know that this opens the app up to CSRF issues, so each JWT is signed with a unique CSRF token. This token is passed along to the frontend and stored in localStorage. Each subsequent API call (using `fetch`) passes the token and the cookie to the backend, where they're both checked for validity (the passed token has to match the version in the JWT). Tokens have a validity period of 24 hours.

Here's an example decoded JWT:

```javascript
{
    "sub": "5c74344466bbe82823b2398e", // user ID
    "xsrfToken": "40410912-944d-4652-8b7a-40ba4f8892eb", // unique CSRF token
    "iat": 1551165098,
    "exp": 1551251498
}
```

## The future

Here's a few things I want to do in the future:
* Unit testing (coming soon!)
* A token refresh system
* Email verifications and notifications