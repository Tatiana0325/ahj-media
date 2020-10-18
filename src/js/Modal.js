export default class Modal {
  constructor(container) {
    this.container = container;
    this.addTicket = this.addTicket.bind(this);
    this.recordData = this.recordData.bind(this);
    this.timer = this.timer.bind(this);
    this.elem = null;
  }

  createWidget() {
    const widget = document.createElement("div");
    widget.classList.add("widget-container");
    widget.innerHTML = `
		<div class="list"></div>
      <div class="footer">
      <form class="form">
        <input class="form-input" name="input" type="text">
      </form>
      <div class="actions">
        <div class="video"><img src="../img/camcorder.png"></div>
        <div class="audio"><img src="../img/microphone.png"></div>
      </div>
      <div class="record hidden">
        <div class="stop">&#10004</div>
        <div class="time">0</div>
        <div class="cancel">&#10006</div>
      </div>
      </div>
		`;

		this.container.appendChild(widget);
    document.querySelector(".video").addEventListener("click", () => {
      this.recordData("video");
    });
    document.querySelector(".audio").addEventListener("click", () => {
      this.recordData("audio");
    });
    document.querySelector(".form").addEventListener("submit", this.addTicket);
  }

  addTicket(event) {
    event.preventDefault();
    this.elem = document.createElement("span");
    this.elem.textContent = event.target.input.value;
    this.getPosition();
  }

  getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.showTicket(latitude.toFixed(5), longitude.toFixed(5));
        },
        (error) => {
          this.showModal();
          console.error(error);
        }
      );
    }
  }

  resetInput() {
    this.container.querySelector(".form-input").value = "";
  }

  showTicket(latitude, longitude) {
    const lilst = document.querySelector(".list");
    const ticket = document.createElement("div");
    ticket.classList.add("ticket");
    ticket.innerHTML = `
       <div class="elem"></div>
       <div class="date">${new Date().toLocaleString()}</div>
       <div class="geo">[${latitude},${longitude}]</div>
    `;
    lilst.insertAdjacentElement("afterbegin", ticket);
    this.container
      .querySelector(".elem")
      .insertAdjacentElement("afterbegin", this.elem);
    this.resetInput();
  }

  showModal() {
    const modal = document.createElement("div");
    modal.classList.add("modal");
    modal.innerHTML = `
      <div class="modal-text">Something is wrong  
      <p>Sorry, but we can't determine your location, 
         please give us permission on use geolocation, 
         or text your coordinates
      </p>
      <p>Comma-separated latitude and longitude</p>
      <form class="modal-form">
        <input class="modal-input" name="modal" type="text">
        <button type="reset" class="reset">Cancel</button>
        <button type="submit" class="ok">Ok</button>
      </form>
      </div>
    `;
    this.container.querySelector(".widget").appendChild(modal);
    this.container
      .querySelector(".modal-input")
      .addEventListener("input", this.deleteError);
    this.container
      .querySelector(".modal-form")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        let value = this.checkValidity(event.target.modal.value);
        if (value) {
          value = value[0].split(",");
          const latitude = value[0].trim();
          const longitude = value[1].trim();

          this.hideModal();
          this.showTicket(latitude, longitude);
        } else {
          this.showError(event.target, "Wrong format position");
        }
      });

    this.container
      .querySelector(".modal-form")
      .addEventListener("reset", (event) => {
        event.preventDefault();
        this.hideModal();
      });
  }

  hideModal() {
    this.container.querySelector(".modal").remove();
    this.resetInput();
  }

  /* eslint-disable */
  checkValidity(string) {
    return string.match(/^\[?\d+\.\d+,\s?\-?\d+\.\d+\]?$/gm);
  }

  showError(target, text) {
    target.focus();
    const error = document.createElement("div");
    error.dataset.id = "error";
    error.className = "form-error";
    error.textContent = `${text}`;

    document.body.appendChild(error);
    const { top, left } = target.getBoundingClientRect();
    error.style.top = `${window.scrollY + top + target.offsetHeight / 2}px`;
    error.style.left = `${window.scrollX + left + target.offsetWidth / 3}px`;
  }

  deleteError() {
    if (document.querySelector(".form-error")) {
      document.querySelector(".form-error").remove();
    }
  }

  timer() {
    const time = this.container.querySelector(".time");
    let count = 1;
    this.timerId = setInterval(() => {
      time.textContent = count;
      count++;
    }, 1000);
  }

  recordData(atribute) {
    this.container.querySelector(".record").classList.remove("hidden");
    this.container.querySelector(".actions").classList.add("hidden");
    this.timer();

    (async () => {
      if (!navigator.mediaDevices && !window.MediaRecorder) {
        return;
      }
      try {
        const elem = document.createElement(atribute);
        elem.controls = true;
        let stream;
        if (atribute === "audio") {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
          const box = document.createElement("div");
          box.classList.add("box");
          box.appendChild(elem);
          this.container
            .querySelector(".footer")
            .insertAdjacentElement("afterbegin", box);

          elem.srcObject = stream;
          elem.play();
        }

        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.addEventListener("dataavailable", (event) => {
          chunks.push(event.data);
        });

        recorder.addEventListener("stop", () => {
          elem.srcObject = null;
          const blob = new Blob(chunks);
          elem.src = URL.createObjectURL(blob);
        });
        this.elem = elem;
        recorder.start();

        this.container
          .querySelector(".record")
          .addEventListener("click", (event) => {
            if (event.target.classList.contains("stop")) {
              clearInterval(this.timerId);
              this.container.querySelector(".time").textContent = "0";
              stream.getTracks().forEach((track) => track.stop());
              this.container.querySelector(".record").classList.add("hidden");
              this.container
                .querySelector(".actions")
                .classList.remove("hidden");
              this.getPosition();
            } else if (event.target.classList.contains("cancel")) {
              recorder.stop();
              stream.getTracks().forEach((track) => track.stop());
              this.container.querySelector(".record").classList.add("hidden");
              this.container
                .querySelector(".actions")
                .classList.remove("hidden");
            }
          });
      } catch (e) {
        console.error(e);
      }
    })();
  }
}
