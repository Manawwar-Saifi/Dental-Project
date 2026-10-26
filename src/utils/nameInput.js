/**
 * Name input helpers.
 *
 * A person's name may only contain letters, spaces and dots (the dot allows
 * initials/titles like "Dr."). Digits and other symbols are stripped as the
 * user types. Use `filterName` in the onChange of any person-name input.
 */
export const filterName = (value = "") => value.replace(/[^A-Za-z .]/g, "");

/** Standard placeholder for person-name inputs. */
export const NAME_PLACEHOLDER = "Enter your full name";
