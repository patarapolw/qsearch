# QSearch

Search a database with a string. Designed for end-users.

## Example

See <https://q-search.herokuapp.com>

## Usage

This is inspired from [lunr.js](https://lunrjs.com/guides/searching.html) search by fields, if specified, with some major differences.

- Default connector is `AND`.
- To make an `OR`, use `?expression`.
- `+expression` means exactly match.
- `-expression` means negation.
- Not only `:`, but also `>` and `<` is used to specify comparison. For example, `+foo:bar`, `count>1`.
- Date comparison is enabled.
  - Special keyword: `NOW`.
  - `+1h` means next 1 hour. `-1h` mean 1 hour ago.
    - Available units are `y (year)`, `M (month)`, `w (week)`, `d (day)`, `h (hour)`, `m (minute)`.
- Extra keywords, such as `is:duplicate` can be set.
- Tested for [loki.js](https://github.com/techfort/LokiJS), [nedb](https://github.com/louischatriot/nedb), and [MongoDB](https://www.mongodb.com/). Also, pure JavaScript Array filtering is possible too.
- For SQL's, you might need extra work to convert to queries, or just use NoSQL's.

## Used in

This project is used in <https://github.com/patarapolw/learn-unicode>

## Similar projects

- <https://github.com/patarapolw/q2filter>
