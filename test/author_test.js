'use strict';

import assert from 'assert';
import {Author} from '../src/index';

/**
 * @test {Author}
 */
describe('Author', () => {

  /**
   * @test {Author.fromJSON}
   */
  describe('.fromJSON()', () => {
    it('should return a null reference with a non-object value', () => {
      assert.strictEqual(Author.fromJSON('foo'), null);
    });

    it('should return an empty instance with an empty map', () => {
      let author = Author.fromJSON({});
      assert.equal(author.email.length, 0);
      assert.equal(author.url.length, 0);
    });

    it('should return an initialized instance with a non-empty map', () => {
      let author = Author.fromJSON({
        comment_author_email: 'cedric@belin.io',
        comment_author_url: 'https://belin.io'
      });

      assert.equal(author.email, 'cedric@belin.io');
      assert.equal(author.url, 'https://belin.io');
    });
  });

  /**
   * @test {Author#toJSON}
   */
  describe('#toJSON()', () => {
    it('should return an empty map with a newly created instance', () => {
      assert.equal(Object.keys(new Author().toJSON()).length, 0);
    });

    it('should return a non-empty map with a initialized instance', () => {
      let author = new Author('127.0.0.1');
      author.email = 'cedric@belin.io';
      author.name = 'Cédric Belin';
      author.url = 'https://belin.io';

      let data = author.toJSON();
      assert.equal(data.comment_author, 'Cédric Belin');
      assert.equal(data.comment_author_email, 'cedric@belin.io');
      assert.equal(data.comment_author_url, 'https://belin.io');
      assert.equal(data.user_ip, '127.0.0.1');
    });
  });

  /**
   * @test {Author#toString}
   */
  describe('#toString()', () => {
    let author = new Author('127.0.0.1');
    author.email = 'cedric@belin.io';
    author.name = 'Cédric Belin';
    author.url = 'https://belin.io';

    let data = String(author);
    it('should start with the class name', () => {
      assert.equal(data.indexOf('Author {'), 0);
    });

    it('should contain the instance properties', () => {
      assert.ok(data.includes('"comment_author":"Cédric Belin"'));
      assert.ok(data.includes('"comment_author_email":"cedric@belin.io"'));
      assert.ok(data.includes('"comment_author_url":"https://belin.io"'));
      assert.ok(data.includes('"user_ip":"127.0.0.1"'));
    });
  });
});
