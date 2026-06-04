# Acceptance Checklist

## RWD

- Test mobile: 360x640 and 390x844.
- Test tablet: 768x1024 and 1024x768.
- Test desktop: 1366x768 and 1440x900.
- Test wide desktop: 1920x1080.
- Frontend listing cards keep stable image aspect ratios.
- Admin tables become stacked rows on mobile and do not overflow.
- Chart.js canvases stay inside their card containers.

## Accessibility

- Every page has one main landmark and a skip link.
- Every form input has a visible label.
- Error messages are associated with fields using `aria-describedby` where applicable.
- Buttons and links have accessible names.
- Status badges include text and do not rely only on color.
- Focus is visible on keyboard navigation.
- All item images include useful `alt` text.
- Chat timestamps are visible text.
- Empty, loading, and error states include readable text.

## Functional

- Guest users can browse items but must log in to chat, reserve, or list items.
- Frozen students cannot log in or publish items.
- Item upload accepts no more than five images.
- Discount price must not exceed original price.
- Accepting an appointment sets the item to `reserved`.
- `reserved` items cannot receive another active appointment.
- Admin freeze, unfreeze, and violation removal actions create audit logs.
