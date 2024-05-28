const catchError = require("../utils/catchError");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendEmail");
const EmailCode = require("../models/EmailCode");
const jwt = require("jsonwebtoken");

const getAll = catchError(async (req, res) => {
  const results = await User.findAll();
  return res.json(results);
});

const create = catchError(async (req, res) => {
  const { email, password, firstName, lastName, country, image, frontBaseUrl } =
    req.body;
  const encriptedPassword = await bcrypt.hash(password, 10);
  const result = await User.create({
    email,
    password: encriptedPassword,
    firstName,
    lastName,
    country,
    image,
  });
  const code = require("crypto").randomBytes(32).toString("hex");
  const link = `${frontBaseUrl}/${code}`;

  await EmailCode.create({
    code: code,
    UserId: result.id,
  });

  await sendEmail({
    to: email,
    subject: "verificate email",
    html: `
        <h1>Hola! ${firstName} ${lastName} </h1>
        <p>Gracias por crear tu cuenta </p>
        <a href= "${link}">${link}</a>
        `,
  });
  return res.status(201).json(result);
});

const getOne = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await User.findByPk(id);
  if (!result) return res.sendStatus(404);
  return res.json(result);
});

const remove = catchError(async (req, res) => {
  const { id } = req.params;
  await User.destroy({ where: { id } });
  return res.sendStatus(204);
});

const update = catchError(async (req, res) => {
  const { id } = req.params;
  const { email, firstName, lastName, country, image } = req.body;
  const result = await User.update(
    { email, firstName, lastName, country, image },
    { where: { id }, returning: true }
  );
  if (result[0] === 0) return res.sendStatus(404);
  return res.json(result[1][0]);
});

const verifyCode = catchError(async (req, res) => {
    const { code } = req.params
    const emailCoding = await EmailCode.findOne({ where: { code: code }})
    if (!emailCoding) return res.status(401).json({message: "invalid code"})
    
    const user = await User.update(
        {isVerified: true},
        {where: {id:emailCoding.UserId}, returning: true}
    )

    // const user = await User.findByPk(EmailCode.userId)
    // user.isVerified = true
    // await user.save()

    await emailCoding.destroy()
        return res.json(user);
})

const login = catchError(async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ where: { email }})
  if (!user) return res.status(401).json({message: "invalid"})
  if (!user.isVerified) return res.status(401).json({message: "user is not verified"})
  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) return res.status(401).json({message: "invalid"})

  const token = jwt.sign(
    { user },
    process.env.TOKEN_SECRET,
    { expiresIn: "1d"},
  )
  return res.json({ user, token })
})

const getLogUser = catchError(async (req, res) => {
  return res.json(req.user)
})

module.exports = {
  getAll,
  create,
  getOne,
  remove,
  update,
  verifyCode,
  login,
  getLogUser,
};
