const expect = require('chai').expect
const {Block, errs} = require('../src/block')
const Promise = require('bluebird')

describe('Block', function() {
  describe('#constructor()', function() {
    const block = new Block('My Data')
    it('should return an instance of the Block class', function() {
      expect(block).to.be.an.instanceof(Block)
    })

    it('should encode the data field as a hexidecimal string', function() {
      expect(block).to.have.property('body')
      expect(block.body).to.equal('224d79204461746122')
    })

    it('should throw an error when no data is provided', function() {
      expect(() => new Block()).to.throw(errs.EMPTY_BLOCK)
    })
  })

  describe('#validate()', function() {
    const block = new Block('My Data Still')
    // The time must be fixed otherwise the blocks hash will change
    block.time = 1565402886
    const expectedHash =
      '5629e8ff53efce6137f841c833277dfe291bd751f9755e60a9ad0f0c1de91c3a'
    const incorrectHash =
      '27450c4a10683796d788c6046a8565d7a9847468ce86167a02872bd33f69f5a2'
    // I am protesting this. Considering the function is completely sync
    // adding a promise just introduces overhead; however, it is part of
    // the spec so here is the test.
    it('should return a promise', function() {
      expect(block.validate()).to.be.an.instanceof(Promise)
    })

    it('should validate a correct hash', function() {
      block.hash = expectedHash
      expect(block._validate()).to.be.true
    })

    it('should fail to validate an incorrect hash', function() {
      block.hash = incorrectHash
      expect(block._validate()).to.be.false
    })

    it('should be ensure the block has not been changed', function() {
      block.height++
      block.hash = expectedHash
      expect(block._validate()).to.be.false
    })
  })

  describe('#getBData()', function() {
    const data = 'My Block Data'
    const block = new Block(data)
    block.height = 1

    // See protest comment above.
    it('should return promise', function() {
      expect(block.getBData()).to.be.an.instanceof(Promise)
    })

    it("should decode the data to it's original content", function() {
      expect(block._getBData()).to.equal(data)
    })

    it('should handle data of any type that can be serialized', function() {
      const data = {my: 'objectified', data: true}
      const block = new Block(data)
      block.height = 1
      expect(block._getBData()).to.eql(data)
    })

    it('should throw an error on the genisis block', function() {
      const block = new Block('My non important data')
      expect(() => block._getBData()).to.throw(errs.READ_GENESIS)
    })
  })
})
