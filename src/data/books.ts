import type { Book, Entry } from './storage'
type BaseEntry = Pick<Entry, 'id' | 'text' | 'amount' | 'date' | 'done'>
export type Expense = BaseEntry & Pick<Entry, 'category' | 'sourceShoppingId'>
export type Task = BaseEntry &
  Pick<Entry, 'dueDate' | 'priority' | 'completedOn'>
export type DatePlan = BaseEntry &
  Pick<Entry, 'plannedFor' | 'note' | 'completedOn'>
export type BudgetBook = Pick<Book, 'limit'> & { entries: Expense[] }
export type TaskBook = Pick<Book, 'limit'> & { entries: Task[] }
export type CookingBook = Pick<
  Book,
  'limit' | 'pantry' | 'foods' | 'supplies'
> & { entries: BaseEntry[] }
export type DateBook = Pick<Book, 'limit'> & { entries: DatePlan[] }
export type ShoppingBook = Pick<
  Book,
  'limit' | 'furniture' | 'savingsGoal' | 'remindersEnabled' | 'supplies'
> & {
  entries: (BaseEntry &
    Pick<
      Entry,
      | 'status'
      | 'coolingDays'
      | 'buyReason'
      | 'ownsSimilar'
      | 'useFrequency'
      | 'note'
      | 'decidedOn'
      | 'rewardCoins'
      | 'savedAmount'
    >)[]
}
export type { PetBook } from './storage'
