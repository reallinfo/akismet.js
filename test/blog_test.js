'use strict';

import assert from 'assert';
import {Blog} from '../src/index';

/**
 * @test {Blog}
 */
describe('Blog', () => {

  /**
   * @test {Blog.fromJSON}
   */
  describe('.fromJSON()', () => {
    it('should return a null reference with a non-object value', () => {
      assert.strictEqual(Blog.fromJSON('foo'), null);
    });

    it('should return an empty instance with an empty map', () => {
      let blog = Blog.fromJSON({});
      assert.equal(blog.charset.length, 0);
      assert.equal(blog.languages.length, 0);
      assert.equal(blog.url.length, 0);
    });

    it('should return an initialized instance with a non-empty map', () => {
      let blog = Blog.fromJSON({
        blog: 'https://github.com/cedx/akismet.js',
        blog_charset: 'UTF-8',
        blog_lang: 'en, fr'
      });

      assert.equal(blog.charset, 'UTF-8');
      assert.equal(blog.languages.length, 2);
      assert.equal(blog.languages[0], 'en');
      assert.equal(blog.languages[1], 'fr');
      assert.equal(blog.url, 'https://github.com/cedx/akismet.js');
    });
  });

  /**
   * @test {Blog#toJSON}
   */
  describe('#toJSON()', () => {
    it('should return an empty map with a newly created instance', () => {
      assert.equal(Object.keys(new Blog().toJSON()).length, 0);
    });

    it('should return a non-empty map with a initialized instance', () => {
      let data = new Blog('https://github.com/cedx/akismet.js', 'UTF-8', ['en', 'fr']).toJSON();
      assert.equal(Object.keys(data).length, 3);
      assert.equal(data.blog, 'https://github.com/cedx/akismet.js');
      assert.equal(data.blog_charset, 'UTF-8');
      assert.equal(data.blog_lang, 'en,fr');
    });
  });

  /**
   * @test {Blog#toString}
   */
  describe('#toString()', () => {
    let data = String(new Blog('https://github.com/cedx/akismet.js', 'UTF-8', ['en', 'fr']));

    it('should start with the class name', () => {
      assert.equal(data.indexOf('Blog {'), 0);
    });

    it('should contain the instance properties', () => {
      assert.ok(data.includes('"blog":"https://github.com/cedx/akismet.js"'));
      assert.ok(data.includes('"blog_charset":"UTF-8"'));
      assert.ok(data.includes('"blog_lang":"en,fr"'));
    });
  });
});
