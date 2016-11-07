# XLAddress
**XLAddress** is a convenient util which provide an angular directive to select provinces, cities, districts and streets.

![示例图片](https://github.com/Snowgan/XLAddress/blob/master/demo.png)

## How to use

Import 'xl.address' to your main module.

```javascript
angular.module('app', ['xl.address']);
```

And then use directive in html.

```html
<xl-address-select></xl-address-select>
// or
<div xl-address-select></div>
```

## Attributes

There are four custom properties.

| attribute     | description                              | type     | default   |
| ------------- | ---------------------------------------- | -------- | --------- |
| placeholder   | Default text when no any selection       | String   |           |
| addr-selected | Stored the selection                     | Array    | undefined |
| addr-callback | Occured when selection complete          | Function |           |
| addr-clearfun | Occured when click clear button on the right | Function |           |



See the demo folder to get more detail.