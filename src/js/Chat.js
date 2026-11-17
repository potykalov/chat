import ChatAPI from "./api/ChatAPI.js";

export default class Chat {
  constructor(container) {
    if (!container) {
      throw new Error('Контейнер "#root" не найден');
    }

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
          <button class="chat__exit" type="button">Выйти</button>
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
    this.modalForm.addEventListener("submit", this.onEnterChatHandler);
    this.exitButton.addEventListener("click", this.onExitChatHandler);
    this.messageForm.addEventListener("submit", this.onSendMessageHandler);
  }

  connect() {
    this.websocket = new WebSocket("ws://localhost:3000");

    this.websocket.addEventListener("open", () => {
      console.log("WebSocket: соединение установлено");
    });

    this.websocket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        if (Array.isArray(data)) {
          this.renderUsers(data);
        } else if (data.type === "send") {
          this.renderMessage(data);
        }
      } catch (error) {
        console.error("Ошибка обработки сообщения:", error);
      }
    });

    this.websocket.addEventListener("error", (event) => {
      console.error("WebSocket: ошибка соединения", event);
    });

    this.websocket.addEventListener("close", () => {
      console.log("WebSocket: соединение закрыто");
    });
  }

  subscribeOnEvents() {}

  onEnterChatHandler = async (e) => {
    e.preventDefault();

    const name = this.nameInput.value.trim();

    if (!name) {
      this.hint.textContent = "Введите имя";
      return;
    }

    this.hint.textContent = "";

    try {
      const response = await this.api.create({ name });

      if (!response?.user) {
        throw new Error(response?.message || "Не удалось войти в чат");
      }

      this.user = response.user;

      this.modal.classList.remove("active");
      this.chatElement.classList.remove("hidden");

      this.chatUsername.textContent = this.user.name;

      this.connect();
    } catch (error) {
      this.hint.textContent = error.message;
      console.error(error);
    }
  };

  onExitChatHandler = () => {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(
        JSON.stringify({
          type: "exit",
          user: this.user,
        })
      );
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.chatElement.classList.add("hidden");
    this.modal.classList.add("active");

    this.nameInput.value = "";
    this.messagesContainer.innerHTML = "";
    this.usersContainer.innerHTML = "";
    this.user = null;
  };

  sendMessage(message) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket-соединение не установлено");
      return false;
    }

    this.websocket.send(
      JSON.stringify({
        type: "send",
        user: this.user,
        message,
      })
    );

    return true;
  }

  renderMessage(data) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat__message");

    const username = document.createElement("span");
    username.classList.add("chat__message-username");
    username.textContent = data.user?.name || "Пользователь";

    const messageText = document.createElement("p");
    messageText.classList.add("chat__message-text");
    messageText.textContent = data.message;

    messageElement.append(username, messageText);
    this.messagesContainer.append(messageElement);

    messageElement.scrollIntoView({ behavior: "smooth" });
  }

  renderUsers(users) {
    this.usersContainer.innerHTML = "";

    users.forEach((user) => {
      const userElement = document.createElement("div");
      userElement.classList.add("chat__user");
      userElement.textContent = user.name;

      this.usersContainer.append(userElement);
    });
  }

  onSendMessageHandler = (e) => {
    e.preventDefault();

    const message = this.messageInput.value.trim();

    if (!message) {
      return;
    }

    const isSent = this.sendMessage(message);

    if (isSent) {
      this.messageInput.value = "";
    }
  };
}
