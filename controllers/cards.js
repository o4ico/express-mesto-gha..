const Card = require('../models/card');
const { NotFoundError } = require('../errors/NotFoundError');
const { ForbiddenError } = require('../errors/ForbiddenError');
const { BadRequestError } = require('../errors/BadRequestError');

module.exports.getCards = (req, res, next) => {
  Card.find({})
    .populate('owner')
    .then(cards => res.status(200).send(cards))
    .catch((err) => next(err));
};

module.exports.createCard = (req, res, next) => {
  console.log(req.user._id);
  const { name, link } = req.body;

  console.log(name, link, req.user._id);
  Card.create({ name, link, owner: req.user._id })
    .then((cards) => res.status(201).send(cards))
    .catch((err) => {
      if (err.name === 'CastError' || err.name === 'ValidationError') {
        return Promise.reject(new BadRequestError('Переданы некорректные данные при создании карточки'));
      }
      next(err);
    });
}

module.exports.deleteCard = (req, res, next) => {
  const { cardId } = req.params;
  Card.findById(cardId)
    .then((card) => {
      if (!card) {
        return Promise.reject(new NotFoundError(`Карточка с указанным id(${cardId}) не найдена`));
      }
      if (card.owner.toString() !== req.user._id) {
        return Promise.reject(new ForbiddenError('Нельзя удалить чужую карточку'));
      }
      console.log(card.owner.toString(), card.owner, req.user._id, cardId);
      return card.deleteOne()

        .then(() => res.send({ message: 'Карточка удалена!' }));
    })
    .catch((err) => {
      if (err.name === 'CastError' || err.name === 'ValidationError') {
        return Promise.reject(new BadRequestError('Переданы некорректные данные при удалении карточки'));
      }
      next(err);
    });
}

module.exports.putLikeCard = (req, res, next) => {
  const { cardId } = req.params;
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } }, // добавить _id в массив, если его там нет
    { new: true },
  )
    .then((card) => {
      if (!card) {
        return Promise.reject(new NotFoundError(`Карточка с указанным id(${cardId}) не найдена`));
      } else {
        return res.status(200).send(card)
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        return Promise.reject(new BadRequestError('Переданы некорректные данные при добавлении лайка карточке'));
      }
      next(err);
    });
}

module.exports.deleteLikeCard = (req, res, next) => {
  const { cardId } = req.params;
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } }, // убрать _id из массива
    { new: true },
  )
    .then((card) => {
      if (!card) {
        return Promise.reject(new NotFoundError(`Карточка с указанным id(${cardId}) не найдена`));
      } else {
        return res.status(200).send(card)
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        return Promise.reject(new BadRequestError('Переданы некорректные данные при удалении лайка с карточки'));
      }
      next(err);
    });
}