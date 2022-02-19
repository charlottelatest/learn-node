const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: 'Please enter a store name!',
    },
    slug: String,
    description: {
      type: String,
      trim: true,
    },
    tags: [String],
    created: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: {
        type: String,
        default: 'Point',
      },
      coordinates: [
        {
          type: Number,
          required: 'You must supply coordinates!',
        },
      ],
      address: {
        type: String,
        required: 'You must supply an address!',
      },
    },
    photo: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: 'You must supply an author',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

storeSchema.index({
  name: 'text',
  description: 'text',
});

storeSchema.index({ location: '2dsphere' });

storeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id', // Store 的「_id」欄位
  foreignField: 'store', // Review 的「store」欄位
});

// Indicates the slug of store
storeSchema.pre('save', async function (next) {
  if (!this.isModified('name')) return next();
  this.slug = slug(this.name);
  // store-1, store-2, store-2 ...
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  // If there are slugs matched "store-1, store-2, store-2 ..."
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});

storeSchema.statics.getTagsList = function () {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

storeSchema.statics.getTopStores = function () {
  return this.aggregate([
    // Lookup stores and populate their reviews
    {
      $lookup: {
        from: 'reviews', // 為何這裡的 review 要加「s」，而虛擬欄位 Ref 中的 review 不用？原因是 mongoDB 的 from 會自動把 Review 變成小寫，並且加入 s
        localField: '_id',
        foreignField: 'store',
        as: 'reviews',
      },
    },
    // Qeury for only items that have 2 or more reviews
    { $match: { 'reviews.1': { $exists: true } } }, // 在 MongoDB 中，要表示第二筆紀錄使用「.1」方式，因此第一筆為「.0」
    // Add some fields
    {
      $project: {
        photo: '$$ROOT.photo',
        name: '$$ROOT.name',
        reviews: '$$ROOT.reviews',
        slug: '$$ROOT.slug',
        averageRating: { $avg: '$reviews.rating' },
      },
    }, // 增加「averageRating」欄位，在 MongoDB 3.2 中使用「project」
    // Sort it by our new fields, highest reviews first
    { $sort: { averageRating: -1 } },
    // Limit to at most 10
    { $limit: 10 },
  ]);
};

function autoPopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autoPopulate);
storeSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Store', storeSchema);
