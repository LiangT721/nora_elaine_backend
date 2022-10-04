const current_date = () => {
  let date_ob = new Date();

  // current date
  // adjust 0 before single digit date
  let date = ("0" + date_ob.getDate()).slice(-2);

  // current month
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  // current year
  let year = date_ob.getFullYear();

  return year + "-" + month + "-" + date;
};

const get_time = () => {
  let time = new Date();
  return time
}

exports.current_date = current_date;
exports.get_time = get_time;
