import type { Affirmation } from '../types'

export const AFFIRMATIONS: Affirmation[] = [
  { id: 'a1', text: 'Я достаточно хороший педагог уже сегодня.', category: 'confidence' },
  { id: 'a2', text: 'Моя энергия восполняется, когда я забочусь о себе.', category: 'energy' },
  { id: 'a3', text: 'Я умею создавать безопасный контакт с детьми.', category: 'children' },
  { id: 'a4', text: 'Я принимаю себя в усталости и в силе.', category: 'acceptance' },
  { id: 'a5', text: 'Мой опыт — опора, а не груз.', category: 'confidence' },
  { id: 'a6', text: 'Я могу делать паузы — это профессиональная мудрость.', category: 'energy' },
  { id: 'a7', text: 'Дети чувствуют мою теплоту даже в сложных днях.', category: 'children' },
  { id: 'a8', text: 'Мне не нужно быть идеальным, чтобы быть важным.', category: 'acceptance' },
  { id: 'a9', text: 'Я вижу прогресс там, где раньше видел(а) только проблемы.', category: 'confidence' },
  { id: 'a10', text: 'Моё тело заслуживает отдыха после дня отдачи.', category: 'energy' },
  { id: 'a11', text: 'Я могу быть строгим и добрым одновременно.', category: 'children' },
  { id: 'a12', text: 'Я разрешаю себе не знать всего прямо сейчас.', category: 'acceptance' },
  { id: 'a13', text: 'Мой голос и присутствие имеют значение.', category: 'confidence' },
  { id: 'a14', text: 'Я выбираю один шаг за раз — и этого достаточно.', category: 'energy' },
  { id: 'a15', text: 'Я учусь слышать детей и слышать себя.', category: 'children' },
  { id: 'a16', text: 'Ошибки — часть роста, а не приговор.', category: 'acceptance' },
  { id: 'a17', text: 'Я профессионал, который развивается бережно.', category: 'confidence' },
  { id: 'a18', text: 'Моя чувствительность — сила, а не слабость.', category: 'energy' },
  { id: 'a19', text: 'Каждый ребёнок может встретить во мне опору.', category: 'children' },
  { id: 'a20', text: 'Я достоин(а) поддержки так же, как другие.', category: 'acceptance' },
  { id: 'a21', text: 'Я справляюсь лучше, чем думаю в трудный момент.', category: 'confidence' },
  { id: 'a22', text: 'Я возвращаю себе внимание и дыхание.', category: 'energy' },
  { id: 'a23', text: 'Я создаю пространство, где можно учиться без страха.', category: 'children' },
  { id: 'a24', text: 'Я принимаю свой темп восстановления.', category: 'acceptance' },
  { id: 'a25', text: 'Моя работа имеет смысл даже в незаметных деталях.', category: 'confidence' },
  { id: 'a26', text: 'Я наполняюсь маленькими радостями дня.', category: 'energy' },
  { id: 'a27', text: 'Я вижу в детях потенциал и берегу его.', category: 'children' },
  { id: 'a28', text: 'Я могу просить помощь — это зрелость.', category: 'acceptance' },
  { id: 'a29', text: 'Я доверяю своему педагогическому чутью.', category: 'confidence' },
  { id: 'a30', text: 'Сегодня я выбираю мягкость к себе.', category: 'acceptance' },
  { id: 'a31', text: 'Я восстанавливаю баланс шаг за шагом.', category: 'energy' },
]

export const AFFIRMATION_LABELS: Record<Affirmation['category'], string> = {
  confidence: 'Профессиональная уверенность',
  energy: 'Энергия',
  children: 'Контакт с детьми',
  acceptance: 'Принятие',
}

export function affirmationForDate(date = new Date()): Affirmation {
  const start = new Date(date.getFullYear(), 0, 0)
  const day = Math.floor((date.getTime() - start.getTime()) / 86400000)
  return AFFIRMATIONS[day % AFFIRMATIONS.length]
}
