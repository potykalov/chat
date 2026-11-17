import Entity from "./Entity.js";
import createRequest from "./createRequest.js";

export default class ChatAPI extends Entity {
  #url;

  constructor() {
    super();
    this.#url = "http://localhost:3000/";
  }

  async create(data) {
    return createRequest({
      url: `${this.#url}new-user`,
      method: "POST",
      body: data,
    });
  }
}
