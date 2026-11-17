import ChatAPI from "./api/ChatAPI.js";

export default class Chat {
  constructor(container) {
    this.container = container;
    this.api = new ChatAPI();
    this.websocket = null;
  }

  init() {
    this.bindToDOM();
    this.registerEvents();
  }

  bindToDOM() {
    this.container.innerHTML = `
      <div class="modal__form active">
        <div class="modal__background"></div>

        <form class="modal__content">
          <div class="modal__header">
            Добро пожаловать в чат!
          </div>

          <div class="modal__body">
            <div class="form__group">
              <label class="form__label" for="username">
                Введите ваше имя
              </label>

              <input
                class="form__input"
                id="username"
                name="username"
                type="text"
                placeholder="Ваше имя"
                required
              />

              <div class="form__hint"></div>
            </div>
          </div>

          <div class="modal__footer">
            <button class="modal__ok" type="submit">
              Войти
            </button>
          </div>
        </form>
      </div>

      <section class="container hidden">
        <h1 class="chat__header">Общий чат</h1>

        <div class="chat__connect">
          <span class="chat__username"></span>
          <button class="chat__exit">Выйти</button>
        </div>

        <div class="chat__container">
          <div class="chat__area">
            <div class="chat__messages-container"></div>

            <form class="chat__messages-input">
              <input
                class="form__input"
                type="text"
                placeholder="Введите сообщение..."
              />
            </form>
          </div>

          <div class="chat__userlist">
            <h3>Участники</h3>
            <div class="chat__users"></div>
          </div>
        </div>
      </section>
    `;

    this.modal = this.container.querySelector(".modal__form");
    this.modalForm = this.container.querySelector(".modal__content");
    this.nameInput = this.container.querySelector("#username");
    this.hint = this.container.querySelector(".form__hint");

    this.chatElement = this.container.querySelector(".container");
    this.chatUsername = this.container.querySelector(".chat__username");

    this.messagesContainer = this.container.querySelector(
      ".chat__messages-container"
    );

    this.messageForm = this.container.querySelector(".chat__messages-input");

    this.messageInput = this.messageForm.querySelector("input");

    this.usersContainer = this.container.querySelector(".chat__users");
    this.exitButton = this.container.querySelector(".chat__exit");
  }

  connect() {
    this.websocket = new Websocket("ws://localhost:8080/ws");
  }

  registerEvents() {
    this.modalForm.addEventListener("submit", this.onEnterChatHandler);
  }

  subscribeOnEvents() {}

  onEnterChatHandler = async (e) => {
    e.preventDefault();

    const name = this.nameInput.value.trim();

    if (!name) {
      this.hint.textContent = "Введите имя";
      return;
    }

    try {
      const response = await this.api.create({ name });

      console.log(response);

      this.user = response.user;

      this.modal.classList.remove("active");
      this.chatElement.classList.remove("hidden");

      this.chatUsername.textContent = this.user.name;

      this.connect();
    } catch (error) {
      this.hint.textContent = error.message;
    }
  };

  sendMessage() {}

  renderMessage() {}
}
