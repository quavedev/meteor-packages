# Changelog

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
