const generate_expiry_date = (duration_hours) => {
  const date = new Date()
  const numOfHours = duration_hours;
  date.setTime(date.getTime() + numOfHours * 60 * 60 * 1000)
  return date.getTime();
}

const compare_expiry_date = (expiry_date) => {
  const monent = Date.now()
  return(expiry_date > monent)
}

exports.generate_expiry_date = generate_expiry_date;
exports.compare_expiry_date = compare_expiry_date;