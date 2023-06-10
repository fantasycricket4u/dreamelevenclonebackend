const User = require("./models/user");

module.exports.getkeys = async function () {
  let user = await User.findById("646c70679da9df38e6273a43");
  const totalhits = user.totalhits;
  if (totalhits > 1000) {
    user.totalhits = 0;
    await user.save();
  }
  const date = new Date().getDate();
  console.log(totalhits, "totalhits");
  const keyindex = Math.floor(date / 2);
  const keyi = Math.floor(totalhits / 100);
  console.log(keyi, "index");
  const keys = [
    "f6c54e8046msh9ade928a37f126bp15dc9fjsnbdbaac07848f",
    "22e5eb9581msh463d68b77f60aedp15ca87jsn7178d984f2fc",
    "5658c3593amshd74d634f219e8d1p148490jsna5981aed9d41",
    "3dacdde1e6msh9af4512ff7f6071p14cef5jsncfe48301c5b3",
    "aca6bd9aaamshbd23802d3eaa77cp14bcc1jsn91c267bfcfee",
    "3827482ab0msh2682459121bc4e9p182f86jsn5e5bf239f56d",
    "36bfaeaf2bmshf3d4c6a7d578422p138403jsn352bedc63511",
    "3ddef92f6emsh8301b1a8e1fd478p15bb8bjsnd0bb5446cadc",
    "77cac70752msh1ce13ec8cd5c240p1160fbjsn5e68d56cf5a5",
    "3e774772f1mshd335b4ddbbd2512p194714jsnb9cc15174c3b",
    "7d69e855b3msh2af85cba1aea4aep1eefd4jsn98b669d3d010",
    "3ddef92f6emsh8301b1a8e1fd478p15bb8bjsnd0bb5446cadc",
    "29c032b76emsh6616803b28338c2p19f6c1jsn8c7ad47ac806",
    "a5da117d90msh3e694894d3b7dbfp12cc3bjsn8167b3fc201c",
    "4c7d3711a8mshb541cbf54879207p15aac7jsn48daf03743bb",
    "006ab906e4msha11eadbec0202a7p17e626jsnd019becb8cdc",
    "7d69e855b3msh2af85cba1aea4aep1eefd4jsn98b669d3d010",
  ];
  return keys[keyi];
};
