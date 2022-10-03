const bcrypt = require("bcrypt");

const generate_hash = (password, saltRounds) => {
  const hash = bcrypt.hashSync(password, saltRounds);
  return hash
};


// const password = "qwe1234";
// const hash = "$2b$10$cXUkGLcjNLocGkDtRW7gkOJGEGqsD/1d9WNdoWRrYh9igejvS6rx2"


exports.generate_hash = generate_hash;
// exports.checkPassword = bcrypt.compareSync(password, hash);

// bcrypt.compare(password, hash, function (err, result) {
//   console.log(result)
//     if (result) {
//       return true;
//     } else {
//       return false;
//     }
//   });


