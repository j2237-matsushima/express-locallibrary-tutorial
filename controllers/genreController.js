const Genre = require("../models/genre");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// ジャンル一覧の表示
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().sort({ name: 1 }).exec();
  res.render("genre_list", {
    title: "ジャンル一覧",
    list_genres: allGenres,
  });
});

// 特定ジャンルの詳細ページを表示
exports.genre_detail = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);
  if (genre === null) {
    const err = new Error("ジャンルが見つかりませんでした");
    err.status = 404;
    return next(err);
  }

  res.render("genre_detail", {
    title: "ジャンル詳細",
    genre: genre,
    genre_books: booksInGenre,
  });
});

// ジャンル作成フォーム（GET）
exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "ジャンルを新規作成" });
};

// ジャンル作成処理（POST）
exports.genre_create_post = [
  // nameフィールドの検証とサニタイズ
  body("name", "ジャンル名は3文字以上で入力してください")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      res.render("genre_form", {
        title: "ジャンルを新規作成",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      const genreExists = await Genre.findOne({ name: req.body.name })
        .collation({ locale: "ja", strength: 2 }) // 日本語ロケールに変更
        .exec();
      if (genreExists) {
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        res.redirect(genre.url);
      }
    }
  }),
];

// ジャンル削除フォーム（GET）
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);
  if (genre === null) {
    res.redirect("/catalog/genres");
  }

  res.render("genre_delete", {
    title: "ジャンルを削除",
    genre: genre,
    genre_books: booksInGenre,
  });
});

// ジャンル削除処理（POST）
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);

  if (booksInGenre.length > 0) {
    res.render("genre_delete", {
      title: "ジャンルを削除",
      genre: genre,
      genre_books: booksInGenre,
    });
    return;
  } else {
    await Genre.findByIdAndDelete(req.body.id);
    res.redirect("/catalog/genres");
  }
});

// ジャンル更新フォーム（GET）
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id).exec();

  if (genre === null) {
    const err = new Error("ジャンルが見つかりませんでした");
    err.status = 404;
    return next(err);
  }

  res.render("genre_form", {
    title: "ジャンルを編集",
    genre: genre,
  });
});

// ジャンル更新処理（POST）
exports.genre_update_post = [
  body("name", "ジャンル名は3文字以上で入力してください")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      res.render("genre_form", {
        title: "ジャンルを編集",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      await Genre.findByIdAndUpdate(req.params.id, genre);
      res.redirect(genre.url);
    }
  }),
];
