import 'server-only'
import { z } from 'zod'
import { CARD_ID, SET_ID } from '../domain'

export const briefSchema=z.object({id:z.string().regex(CARD_ID),name:z.string().min(1),localId:z.string(),image:z.string().nullish()})
export const setSchema=z.object({id:z.string().regex(SET_ID),name:z.string().min(1),logo:z.string().max(300).nullish()})
export const detailSchema=briefSchema.extend({
  set:setSchema.extend({cardCount:z.object({official:z.number().optional(),total:z.number().optional()}).optional()}),
  category:z.string().nullish(),rarity:z.string().nullish(),illustrator:z.string().nullish(),
  hp:z.number().nullish(),types:z.array(z.string()).nullish(),stage:z.string().nullish(),
  evolveFrom:z.string().nullish(),description:z.string().nullish(),effect:z.string().nullish(),
  regulationMark:z.string().nullish(),retreat:z.number().nullish(),
  abilities:z.array(z.object({name:z.string(),type:z.string().optional(),effect:z.string().optional()})).nullish(),
  attacks:z.array(z.object({name:z.string(),cost:z.array(z.string()).optional(),damage:z.union([z.string(),z.number()]).optional(),effect:z.string().optional()})).nullish(),
  weaknesses:z.array(z.object({type:z.string(),value:z.string().optional()})).nullish(),
  resistances:z.array(z.object({type:z.string(),value:z.string().optional()})).nullish(),
  // V14.3: richer facts and marketplace data (pricing is parsed separately and defensively).
  trainerType:z.string().nullish(),energyType:z.string().nullish(),suffix:z.string().nullish(),
  item:z.object({name:z.string(),effect:z.string().optional()}).nullish(),
  dexId:z.array(z.number()).max(20).nullish(),
  legal:z.object({standard:z.boolean().optional(),expanded:z.boolean().optional()}).nullish(),
  variants:z.record(z.string(),z.boolean()).nullish(),
  updated:z.string().max(40).nullish(),
  pricing:z.unknown().optional()
})
