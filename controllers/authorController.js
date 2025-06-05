const Author = require("../models/author");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// 著者一覧を表示
exports.author_list = asyncHandler(async (req, res, next) => {
  const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
  res.render("author_list", {
    title: "著者一覧",
    author_list: allAuthors,
  });
});

// 特定の著者の詳細ページを表示
exports.author_detail = asyncHandler(async (req, res, next) => {
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author === null) {
    const err = new Error("著者が見つかりませんでした");
    err.status = 404;
    return next(err);
  }

  res.render("author_detail", {
    title: "著者の詳細",
    author: author,
    author_books: allBooksByAuthor,
  });
});

// 著者作成フォームを表示 (GET)
exports.author_create_get = (req, res, next) => {
  res.render("author_form", { title: "著者の作成" });
};

// 著者作成を処理 (POST)
exports.author_create_post = [
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("名を入力してください。")
    .isAlphanumeric()
    .withMessage("名には英数字のみを使用してください。"),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("姓を入力してください。")
    .isAlphanumeric()
    .withMessage("姓には英数字のみを使用してください。"),
  body("date_of_birth", "無効な生年月日です")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "無効な死亡日です")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      res.render("author_form", {
        title: "著者の作成",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      await author.save();
      res.redirect(author.url);
    }
  }),
];

// 著者削除フォームを表示 (GET)
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author === null) {
    res.redirect("/catalog/authors");
  }

  res.render("author_delete", {
    title: "著者の削除",
    author: author,
    author_books: allBooksByAuthor,
  });
});

// 著者削除を処理 (POST)
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (allBooksByAuthor.length > 0) {
    res.render("author_delete", {
      title: "著者の削除",
      author: author,
      author_books: allBooksByAuthor,
    });
    return;
  } else {
    await Author.findByIdAndDelete(req.body.authorid);
    res.redirect("/catalog/authors");
  }
});

// 著者更新フォームを表示 (GET)
exports.author_update_get = asyncHandler(async (req, res, next) => {
  const author = await Author.findById(req.params.id).exec();
  if (author === null) {
    const err = new Error("著者が見つかりませんでした");
    err.status = 404;
    return next(err);
  }

  res.render("author_form", { title: "著者の更新", author: author });
});

// 著者更新を処理 (POST)
exports.author_update_post = [
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("名を入力してください。")
    .isAlphanumeric()
    .withMessage("名には英数字のみを使用してください。"),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("姓を入力してください。")
    .isAlphanumeric()
    .withMessage("姓には英数字のみを使用してください。"),
  body("date_of_birth", "無効な生年月日です")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "無効な死亡日です")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      res.render("author_form", {
        title: "著者の更新",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      await Author.findByIdAndUpdate(req.params.id, author);
      res.redirect(author.url);
    }
  }),
];
