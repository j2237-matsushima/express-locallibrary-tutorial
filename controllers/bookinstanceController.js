const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// 書籍インスタンスの一覧を表示
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();

  res.render("bookinstance_list", {
    title: "書籍インスタンス一覧",
    bookinstance_list: allBookInstances,
  });
});

// 特定の書籍インスタンスの詳細ページを表示
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    // 結果なし
    const err = new Error("書籍コピーが見つかりませんでした");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    title: "書籍コピー詳細",
    bookinstance: bookInstance,
  });
});

// 書籍インスタンス作成フォーム（GET）
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

  res.render("bookinstance_form", {
    title: "書籍インスタンスを作成",
    book_list: allBooks,
  });
});

// 書籍インスタンス作成処理（POST）
exports.bookinstance_create_post = [
  // フィールドの検証とサニタイズ
  body("book", "書籍は必須です").trim().isLength({ min: 1 }).escape(),
  body("imprint", "出版社情報は必須です")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "無効な日付です")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // 検証後のリクエスト処理
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

      res.render("bookinstance_form", {
        title: "書籍インスタンスを作成",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];

// 書籍インスタンス削除フォーム（GET）
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    res.redirect("/catalog/bookinstances");
  }

  res.render("bookinstance_delete", {
    title: "書籍インスタンスの削除",
    bookinstance: bookInstance,
  });
});

// 書籍インスタンス削除処理（POST）
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  await BookInstance.findByIdAndDelete(req.body.id);
  res.redirect("/catalog/bookinstances");
});

// 書籍インスタンス更新フォーム（GET）
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  const [bookInstance, allBooks] = await Promise.all([
    BookInstance.findById(req.params.id).populate("book").exec(),
    Book.find(),
  ]);

  if (bookInstance === null) {
    const err = new Error("書籍コピーが見つかりませんでした");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_form", {
    title: "書籍インスタンスの更新",
    book_list: allBooks,
    selected_book: bookInstance.book._id,
    bookinstance: bookInstance,
  });
});

// 書籍インスタンス更新処理（POST）
exports.bookinstance_update_post = [
  body("book", "書籍は必須です").trim().isLength({ min: 1 }).escape(),
  body("imprint", "出版社情報は必須です")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "無効な日付です")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      const allBooks = await Book.find({}, "title").exec();

      res.render("bookinstance_form", {
        title: "書籍インスタンスの更新",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
      await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});
      res.redirect(bookInstance.url);
    }
  }),
];
