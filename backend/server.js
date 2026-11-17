import ChatAPI from "./api/ChatAPI";

export default class Chat {
  constructor(container) {
    this.container = container;
    this.api = new ChatAPI();
    this.websocket = null;
    this.user = null;
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

  registerEvents() {
    this.modalForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.onEnterChatHandler();
    });

    this.messageForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.sendMessage();
    });

    this.exitButton.addEventListener("click", () => {
      this.exitChat();
    });
  }

  async onEnterChatHandler() {
    const name = this.nameInput.value.trim();

    if (!name) {
      this.hint.textContent = "Введите имя";
      return;
    }

    try {
      const response = await this.api.create({ name });

      this.user = response.user;

      this.modal.classList.remove("active");
      this.chatElement.classList.remove("hidden");

      this.chatUsername.textContent = this.user.name;

      this.connect();
    } catch (error) {
      this.hint.textContent = error.message;
    }
  }

  connect() {
    this.websocket = new WebSocket("ws://localhost:3000");

    this.websocket.addEventListener("open", () => {
      console.log("WebSocket connection opened");
    });

    this.websocket.addEventListener("message", (event) => {
      this.subscribeOnEvents(event);
    });

    this.websocket.addEventListener("close", () => {
      console.log("WebSocket connection closed");
    });

    this.websocket.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
    });
  }

  subscribeOnEvents(event) {
    const data = JSON.parse(event.data);

    // Сервер прислал список пользователей
    if (Array.isArray(data)) {
      this.renderUsers(data);
      return;
    }

    // Сервер прислал сообщение
    if (data.type === "send") {
      this.renderMessage(data);
    }
  }

  renderUsers(users) {
    this.usersContainer.innerHTML = "";

    users.forEach((user) => {
      const element = document.createElement("div");

      element.classList.add("chat__user");

      element.textContent =
        user.id === this.user.id ? `${user.name} (You)` : user.name;

      this.usersContainer.append(element);
    });
  }

  sendMessage() {
    const message = this.messageInput.value.trim();

    if (!message || !this.websocket) {
      return;
    }

    if (this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const data = {
      type: "send",
      message,
      user: this.user,
    };

    this.websocket.send(JSON.stringify(data));

    this.messageInput.value = "";
  }

  renderMessage(data) {
    const isMyMessage = data.user.id === this.user.id;

    const messageElement = document.createElement("div");

    messageElement.classList.add("message__container");

    messageElement.classList.add(
      isMyMessage
        ? "message__container-yourself"
        : "message__container-interlocutor"
    );

    const header = document.createElement("div");
    header.classList.add("message__header");

    header.textContent = isMyMessage ? "You" : data.user.name;

    const message = document.createElement("div");
    message.textContent = data.message;

    messageElement.append(header, message);

    this.messagesContainer.append(messageElement);

    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  exitChat() {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(
        JSON.stringify({
          type: "exit",
          user: this.user,
        })
      );

      this.websocket.close();
    }

    this.user = null;

    this.chatElement.classList.add("hidden");
    this.modal.classList.add("active");

    this.nameInput.value = "";
    this.hint.textContent = "";
    this.messagesContainer.innerHTML = "";
    this.usersContainer.innerHTML = "";
  }
}
