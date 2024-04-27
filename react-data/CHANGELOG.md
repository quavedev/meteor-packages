# Changelog

# 4.0.9 (2024-04-27)

- Introduces one new option: `onFinally`. Read more in the documentation.

# 4.0.8 (2024-04-21)

- Exports `EXPECTED_ERROR` in the client as well.

# 4.0.7 (2024-04-21)

- Reorganizes exports to avoid confusions between server and client. To 
  understand which named exports are available, check the 
 [client.js](./client.js) and [server.js](./server.js) files.

# 4.0.6 (2024-04-21)

- Exposing more modules in the server.

# 4.0.5 (2024-04-21)

- Improves documentation about the behavior of `onError` and `onExpectedError`
- Also adjusts the behaviors of `onError` and `onExpectedError` to be more  
  consistent with the documentation.

# 4.0.4 (2024-04-21)

- Provide more data listener of `useMethod`: `onExpectedError`, `onError`, 
  `onSuccess`. Read more in the documentation.

# 4.0.3 (2024-04-21)

- Introduces more options to `useMethod`: `onExpectedError`, `onError`, 
  `onSuccess`. Read more in the documentation.

# 4.0.2 (2024-04-21)

- Introduces `meteorCallPromisified` to avoid workarounds and non-standard 
  way to call simple methods when you don't have a React component.

# 4.0.1 (2024-04-21)

- Documentation improvements.
- Code style improvements.

# 4.0.0 (2023-05-20)

## BREAKING CHANGES

- Removes `EXPECTED_ERROR_SERVER` as it is now also called `EXPECTED_ERROR` 
  in the server to avoid confusions.
- Removes quave:alert-react-tailwind dependency, so if you want to still have an alert you need to provide a function `openAlert` to `useMethod` as prop:

```js
useMethod({ openAlert: (alertMessage) => openYourCustomAlert(alertMessage) })
```

## 3.0.0 (2023-01-20)

- Upgrades to `quave:alert-react-tailwind` 3.0.0 which upgrades `@heroicons/react` to 2. As all the icons locations were changed this is a breaking change.

If you are not using `@heroicons/react` 2 don't upgrade.

## 2.0.1 (2022-06-17)

- Check for the existence of `result` (the return of `useFind`) before accessing `result.fetch`.

## 2.0.0 (2022-06-07)

- Implements `useMethod` and uses `quave:alert-react-tailwind` 2.0 which depends on React Router v6.

## 1.0.0 (2022-01-17)

- Implements `useData`.
