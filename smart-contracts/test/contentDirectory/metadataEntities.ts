import truffleAssert from 'truffle-assertions'
import _ from 'lodash'
import { ContentDirectoryInstance, MetadataEntityStorageInstance } from '../../types/truffle-contracts'
import { setDefaultContractCaller, getCurrentInstances } from '../utils/contracts'
import {
  MetadataEntityType,
  CURATOR_1_ADDRESS_INDEX,
  languageMetadata,
  languageMetadataUpdate,
  LEAD_ADDRESS_INDEX,
} from '../utils/consts'

// TODO: Import events types (but need to deal with BN inside struct type incompatibility)

const metadataEntitiesTests = (accounts: string[]): void => {
  let contentDirectory: ContentDirectoryInstance
  let metadataEntityStorage: MetadataEntityStorageInstance

  beforeEach(async () => {
    ;({ contentDirectory, metadataEntityStorage } = await getCurrentInstances())
  })

  describe('The lead', () => {
    before(() => {
      setDefaultContractCaller(accounts[LEAD_ADDRESS_INDEX])
    })

    describe('should be able to create entities of recognized types', async () => {
      const types = [MetadataEntityType.Language, MetadataEntityType.Category]
      for (const type of types) {
        it(`entityType=${type}`, async () => {
          const res = await contentDirectory.createMetadataEntity(type, languageMetadata)

          assert.equal((await metadataEntityStorage.entityCountByType(type)).toNumber(), 1)
          truffleAssert.eventEmitted(
            res,
            'MetadataEntityCreated',
            (e: any) => e._type.eqn(type) && _.isEqual(e._metadata, languageMetadata)
          )

          assert.isTrue(await metadataEntityStorage.metadataEntityExistsByTypeById(type, 1))
        })
      }
    })

    it('should NOT be able to update unexisting entity', async () => {
      await truffleAssert.reverts(
        contentDirectory.updateMetadataEntity(MetadataEntityType.Language, 1, languageMetadataUpdate)
      )
    })

    it('should NOT be able to remove unexisting entity', async () => {
      await truffleAssert.reverts(contentDirectory.removeMetadataEntity(MetadataEntityType.Language, 1))
    })

    describe('Existing entities', async () => {
      // Each of those test will require an existing entity
      beforeEach(async () => {
        await contentDirectory.createMetadataEntity(MetadataEntityType.Language, languageMetadata)
      })

      it('should be able to update an existing entity', async () => {
        const res = await contentDirectory.updateMetadataEntity(MetadataEntityType.Language, 1, languageMetadataUpdate)
        truffleAssert.eventEmitted(
          res,
          'MetadataEntityUpdated',
          (e: any) =>
            e._type.eqn(MetadataEntityType.Language) && e._id.eqn(1) && _.isEqual(e._metadata, languageMetadataUpdate)
        )
      })

      it('should be able to remove an existing entity', async () => {
        const res = await contentDirectory.removeMetadataEntity(MetadataEntityType.Language, 1)
        truffleAssert.eventEmitted(
          res,
          'MetadataEntityRemoved',
          (e: any) => e._type.eqn(MetadataEntityType.Language) && e._id.eqn(1)
        )

        assert.isFalse(await metadataEntityStorage.metadataEntityExistsByTypeById(MetadataEntityType.Language, 1))
      })
    })
  })

  describe('The curator', () => {
    before(() => {
      setDefaultContractCaller(accounts[CURATOR_1_ADDRESS_INDEX])
    })

    it('should NOT be able to create an entity', async () => {
      await truffleAssert.reverts(contentDirectory.createMetadataEntity(MetadataEntityType.Language, languageMetadata))
    })

    describe('Existing entities', async () => {
      beforeEach(async () => {
        // Create entity as lead first
        await contentDirectory.createMetadataEntity(MetadataEntityType.Language, languageMetadata, {
          from: accounts[LEAD_ADDRESS_INDEX],
        })
      })

      it('should NOT be able to update an entity', async () => {
        await truffleAssert.reverts(
          contentDirectory.updateMetadataEntity(MetadataEntityType.Language, 1, languageMetadataUpdate)
        )
      })

      it('should NOT be able to remove an entity', async () => {
        await truffleAssert.reverts(contentDirectory.removeMetadataEntity(MetadataEntityType.Language, 1))
      })
    })
  })
}

export default metadataEntitiesTests
