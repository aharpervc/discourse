/**
  A data model for containing a list of categories

  @class CategoryList
  @extends Discourse.Model
  @namespace Discourse
  @module Discourse
**/
Discourse.CategoryList = Ember.ArrayProxy.extend({
  init: function() {
    this.content = [];
    this._super();
  },

  moveCategory: function(categoryId, position){
    Discourse.ajax("/category/" + categoryId + "/move", {
      type: 'POST',
      data: { position: position }
    });
  }
});

Discourse.CategoryList.reopenClass({
  categoriesFrom: function(result) {
    var categories = Discourse.CategoryList.create(),
        users = Discourse.Model.extractByKey(result.featured_users, Discourse.User),
        list = Discourse.Category.list();

    result.category_list.categories.forEach(function(c) {

      if (c.parent_category_id) {
        c.parentCategory = list.findBy('id', c.parent_category_id);
      }

      if (c.subcategory_ids) {
        c.subcategories = c.subcategory_ids.map(function(scid) { return list.findBy('id', parseInt(scid, 10)); });
      }

      if (c.featured_user_ids) {
        c.featured_users = c.featured_user_ids.map(function(u) {
          return users[u];
        });
      }
      if (c.topics) {
        c.topics = c.topics.map(function(t) {
          return Discourse.Topic.create(t);
        });
      }

      categories.pushObject(Discourse.Category.create(c));

    });
    return categories;
  },

  listForParent: function(category) {
    var self = this;
    return Discourse.ajax('/categories.json?parent_category_id=' + category.get('id')).then(function(result) {
      return Discourse.CategoryList.create({
        categories: self.categoriesFrom(result)
      });
    });
  },

  list: function() {
    var self = this;

    return PreloadStore.getAndRemove("categories_list", function() {
      return Discourse.ajax("/categories.json");
    }).then(function(result) {
      return Discourse.CategoryList.create({
        categories: self.categoriesFrom(result),
        can_create_category: result.category_list.can_create_category,
        can_create_topic: result.category_list.can_create_topic,
        draft_key: result.category_list.draft_key,
        draft: result.category_list.draft,
        draft_sequence: result.category_list.draft_sequence
      });
    });
  }

});
