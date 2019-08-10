const expect = require('chai').expect
const {Blockchain, errs} = require('../src/blockchain')
const {Block} = require('../src/block')
const Promise = require('bluebird')

const WALLET = 'mpxj1VFYdN6TuSTvPKrfazZiBNgeBLs7Uv'

describe('BlockChain', function() {
  describe('#constructor()', function() {
    const chain = new Blockchain()
    it('should have height initialized to 0', function() {
      expect(chain).to.have.property('height')
      expect(chain.height).to.equal(1)
    })

    it('should have the genesis block in the first position', function() {
      expect(chain.chain).to.have.lengthOf(1)
      expect(chain.chain[0]).to.be.an.instanceof(Block)
    })
  })

  describe('#_addBlock()', function() {
    const chain = new Blockchain()
    const block = new Block('My Content')

    it('should return a promise', function() {
      expect(chain._addBlock(block)).to.be.an.instanceof(Promise)
    })

    it('should increment the chain height', function() {
      expect(chain.height).to.equal(2)
    })

    it('should return a promise of a block', function() {
      expect(chain._addBlockSync(block)).to.be.an.instanceof(Block)
    })

    it('should reject non block objects', function() {
      expect(() =>
        chain
          ._addBlockSync({my: 'fake', block: true})
          .to.throw(errs.BLOCK_TYPE),
      )
    })

    it('should reject old blocks', function() {
      const block = new Block('Old block')
      block.time -= 501
      expect(() => chain._addBlockSync(block)).to.throw(errs.OLD_BLOCK)
    })

    it('should have created the block hash', function() {
      const block = chain._addBlockSync(new Block('My Data'))
      expect(block.hashF()).to.not.be.null
    })

    it('should have the previous blocks hash in the new block', function() {
      const block = chain._addBlockSync(new Block('My Data'))
      const next = chain._addBlockSync(new Block('My Data'))
      expect(next.prevHash).to.not.be.null
      expect(next.prevHash).to.equal(block.hash)
    })

    it('should have created a valid block', function() {
      const block = chain._addBlockSync(new Block('My Data'))
      expect(block._validate()).to.be.true
    })
  })

  describe('#requestMessageOwnershipVerification', function() {
    const chain = new Blockchain()

    it('should return a promise', function() {
      expect(
        chain.requestMessageOwnershipVerification('mywallet'),
      ).to.be.an.instanceof(Promise)
    })

    it('should match the spec `wallet:time:starRegistry`', function() {
      expect(chain._requestMessageOwnershipVerification('mywallet')).to.match(
        /^mywallet\:[0-9]*?\:starRegistry$/,
      )
    })
  })

  // Note to self:
  // For generating address that can sign transactions in bitcoin-core
  // use the command `getnewaddress "" "legacy"`
  describe('#submitStar', function() {
    const chain = new Blockchain()
    const msg = 'mpxj1VFYdN6TuSTvPKrfazZiBNgeBLs7Uv:1565406663:starRegistry'
    const sig =
      'IAm90LqCb/FGtqbO9ZI0JzZQYCkIZyvll4CutaSGUukhIgVX/yTIo4hRbRwCwC1SYluhqtZcYU0uqJeF68xkd7E='
    const badSig =
      'IAaPfM4O+GBCcBS/S45sC8AiRoXf6aJwsSD53J27zhJLcdUYvjEpQ9Wk9BLR7Ysnn0uIfZnSIKSabcLHePMAN43='

    it('should throw if registry is not correct', function() {
      expect(() => chain._submitStar(WALLET, 'abc:123:def', sig, {})).to.throw(
        errs.INVALID_MESSAGE_REGISTRY,
      )
    })

    it('should throw if generated time parsable', function() {
      expect(() =>
        chain._submitStar(WALLET, 'abc:lll:starRegistry', sig, {}),
      ).to.throw(errs.INVALID_MESSAGE)
    })

    it('should reject if the message is over five minutes old', function() {
      expect(() => chain._submitStar(WALLET, msg, sig, {})).to.throw(
        errs.OLD_MESSAGE,
      )
    })

    it('should reject if verification does not work', function() {
      expect(() => chain._submitStar(WALLET, msg, badSig, {}, false)).to.throw(
        errs.INVALID_MESSAGE_SIG,
      )
    })

    it('should not throw if signature is correct', function() {
      expect(() =>
        chain._submitStar(WALLET, msg, sig, {}, false),
      ).not.to.throw()
    })

    it('should have a reference to the star in the block', function() {
      // I think Polaris is a star?!?
      const data = {name: 'Polaris'}
      const star = chain._submitStar(WALLET, msg, sig, data, false)

      expect(star._getBData().star).to.eql(data)
    })

    it('should have a reference to the verifiers address', function() {
      const data = {name: 'Polaris'}
      const star = chain._submitStar(WALLET, msg, sig, data, false)

      expect(star._getBData().verifier).to.eql(WALLET)
    })
  })

  describe('#getBlockByHash', function() {
    const chain = new Blockchain()
    for (let i = 0; i < 150; i++) {
      const blk = new Block('some data')
      chain._addBlock(blk)
    }

    it('should get the correct block', async function() {
      const index = Math.floor(Math.random() * 150)
      const block = chain.chain[index]
      const hash = block.hash
      expect(await chain.getBlockByHash(hash)).to.eql(block)
    })
  })

  describe('#getStarsByWalletAddress', function() {
    const chain = new Blockchain()
    const correctBlock = new Block({verifier: WALLET, star: 'Alpha Centauri B'})
    const incorrectBlock = new Block({verifier: 'none'})
    const anotherCorrectBlock = new Block({
      verifier: WALLET,
      star: 'Alpha Centauri A',
    })

    chain._addBlock(correctBlock)
    chain._addBlock(incorrectBlock)
    chain._addBlock(anotherCorrectBlock)

    it('should return stars owned by the user', async function() {
      expect(await chain.getStarsByWalletAddress(WALLET)).to.eql([
        correctBlock._getBData().star,
        anotherCorrectBlock._getBData().star,
      ])
    })

    it('should return an empty array when no stars are there', async function() {
      expect(await chain.getStarsByWalletAddress('')).to.eql([])
    })
  })

  describe('#validateChain', function() {
    const chain = new Blockchain()
    const block1 = new Block({xyz: 123})
    const block2 = new Block({xyz: 123})
    const block3 = new Block({xyz: 123})

    chain._addBlock(block1)
    chain._addBlock(block2)
    chain._addBlock(block3)

    chain.chain[2].hash = 'abc'

    const errors = chain._validateChain()

    it('should find all the errors', function() {
      expect(errors).to.have.lengthOf(2)
    })

    it('should find inaccurate hashes', function() {
      expect(errors[0].cause).to.eql(errs.INVALID_HASH)
    })

    it('should find innaccuracies in previous hashes', function() {
      expect(errors[1].cause).to.eql(errs.INVALID_PREV_HASH)
    })

    it('should specify the block the error occured in', function() {
      expect(errors[0].block).to.eql(chain.chain[2])
      expect(errors[1].block).to.eql(chain.chain[3])
    })

    it('should specify the block height the error occured at', function() {
      expect(errors[0].height).to.eql(2)
      expect(errors[1].height).to.eql(3)
    })
  })
})
