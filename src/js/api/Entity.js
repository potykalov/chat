export default class Entity {
  list() {}

  get() {}

  async create(data) {
    throw new Error("Отсутствует метод create в классе Entity");
  }

  update() {}

  delete() {}
}
