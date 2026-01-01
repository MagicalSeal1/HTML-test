export default class HomeView {
  // Veri Yapısı: Klasör > Alt Klasör > Dosyalar
  static contentData = {
    "Karargâh Subaylığı": {
      "Genel Kültür": [
        { id: "gnlkltr1", title: "Siyasi Tarih", desc: "236 Soru" },
        { id: "gnlkltr2", title: "Başlangıçtan Günümüze T.C. Tarihi", desc: "9 Soru" },
        { id: "gnlkltr3", title: "Uluslararası Hukuk Temel Ders Kitabı", desc: "6-8 Soru" },
        { id: "gnlkltr4", title: "İdare Hukukuna Giriş", desc: "5-6 Soru" },
        { id: "gnlkltr5", title: "T.C. Anayasası", desc: "4-5 Soru" },
        { id: "gnlkltr6", title: "Basında yer alan askeri, politik, ekonomik güncel olaylar", desc: "4-5 Soru" }
      ],
      "Askeri Kültür (Müşterek)": [
        { id: "musterek1", title: "MDK 3-15(MT 101-5) Karargâhlarda Teşkilat ve Harekât Planlama Usulleri Doktrini", desc: "8 Soru" },
        { id: "musterek2", title: "Resmi Yazışma Usulleri ve Çalışma Esasları Yönergesi", desc: "3-4 Soru" },
        { id: "musterek3", title: "Meslek Etiği Yönergesi", desc: "2-3 Soru" },
        { id: "musterek4", title: "Bilgi ve MEBS Güvenliği Yönergesi", desc: "2-3 Soru" },
        { id: "musterek5", title: "211 Sayılı TSK İç Hizmet Kanunu ve Yönetmeliği", desc: "3-5 Soru" },
        { id: "musterek6", title: "6413 Sayılı TSK Disiplin Kanunu", desc: "2-3 Soru" }
      ],
      "Askeri Kültür (Dzkk)": [
        { id: "dzkk1", title: "ATP-1(E) Müttefik Deniz Taktik Talimatları ve Usulleri", desc: "15-20 Soru" },
        { id: "dzkk2", title: "Dzkk Operatif Seviye Harekât Planlama Talimnamesi", desc: "?? Soru" },
        { id: "dzkk3", title: "Lojistik Planlama Faktörleri Genelgesi", desc: "4 Soru" },
        { id: "dzkk4", title: "Ege Sorunları", desc: "4 Soru" },
        { id: "dzkk5", title: "DKKS 151-1 (D) Deniz Harekât Konsepti", desc: "3 Soru" },
        { id: "dzkk6", title: "Deniz Hukuku El Kitabı", desc: "3 Soru" },
        { id: "dzkk7", title: "Yapay Zeka Konsepti", desc: "2-3 Soru", disabled: true },
        { id: "dzkk8", title: "Denizde Siber Güvenlik Bilgi Kitabı", desc: "3 Soru", disabled: true },
        { id: "dzkk9", title: "Deniz Aşırı Harekât Konsepti", desc: "3 Soru", disabled: true },
        { id: "dzkk10", title: "İnsansız Hava Aracı Sistemleri Konsepti", desc: "3 Soru", disabled: true },
        { id: "dzkk11", title: "Stratejiye Giriş ve Deniz Stratejisi", desc: "3 Soru", disabled: true },
        { id: "dzkk12", title: "ATP-18 Müttefik Denizaltı Harekâtı Talimnamesi", desc: "3 Soru" }
      ],
      "Genel": [
        { id: "gnlkltr6", title: "Karsu Genel", desc: "Tüm konular dahil", disabled: true }
      ]
    },
    "Komuta Kurmay": {
      "Mevzuat": [
        { id: "mevzuat1", title: "Kanunlar", desc: "Yakında", disabled: true }
      ]
    }
  };

  static currentCategory = "Karargâh Subaylığı"; // Varsayılan kategori

  static getHtml() {
    return `
    <div id="view-home" class="grid">
      <!-- Sayfa İçi Header -->
      <div class="view-header">
        <div class="view-header-left">
          <div class="view-header-logo"><img src="assets/icons/logo.png" alt="Logo"></div>
          <div class="view-header-text">
            
            <!-- Custom Dropdown -->
            <div class="header-dropdown" id="headerDropdown">
              <div class="dropdown-trigger">
                <h1 id="headerTitle">${this.currentCategory}</h1>
                <span class="arrow">▾</span>
              </div>
              <div class="header-options" id="headerOptions">
                <!-- JS ile doldurulacak -->
              </div>
            </div>

            <p>Çalışma Kartları & Referans Kaynaklar</p>
          </div>
        </div>
      </div>

      <!-- Dinamik İçerik Alanı -->
      <div id="dynamicContent" style="display: contents;"></div>
      
    </div>
    `;
  }

  static init() {
    this.setupHeaderDropdown();
    this.renderContent(this.currentCategory);
  }

  // === HEADER DROPDOWN LOGIC ===
  static setupHeaderDropdown() {
    const dropdown = document.getElementById("headerDropdown");
    const trigger = dropdown.querySelector(".dropdown-trigger");
    const optionsContainer = document.getElementById("headerOptions");
    const titleEl = document.getElementById("headerTitle");

    // Seçenekleri Doldur
    optionsContainer.innerHTML = "";
    Object.keys(this.contentData).forEach(key => {
      const opt = document.createElement("div");
      opt.className = "header-option";
      if (key === this.currentCategory) opt.classList.add("selected");
      opt.textContent = key;
      
      opt.onclick = () => {
        this.currentCategory = key;
        titleEl.textContent = key;
        
        // Seçili sınıfını güncelle
        dropdown.querySelectorAll(".header-option").forEach(el => el.classList.remove("selected"));
        opt.classList.add("selected");

        // İçeriği Yenile
        this.renderContent(key);
        
        // Menüyü kapat
        dropdown.classList.remove("active");
      };
      
      optionsContainer.appendChild(opt);
    });

    // Aç/Kapa
    trigger.onclick = (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("active");
    };

    // Dışarı tıklayınca kapat
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
      }
    });
  }

  // === CONTENT RENDER LOGIC ===
  static renderContent(categoryKey) {
    const container = document.getElementById("dynamicContent");
    container.innerHTML = "";

    const categoryData = this.contentData[categoryKey];
    if (!categoryData) return;

    // Başlık
    const mainTitle = document.createElement("div");
    mainTitle.className = "main-section-title";
    mainTitle.innerHTML = `<h2>Çalışma Kartları</h2>`;
    container.appendChild(mainTitle);

    // Alt Klasörleri (Section) Döngüye Al
    Object.entries(categoryData).forEach(([subCategoryName, files]) => {
      // 1. Section Title
      const sectionTitle = document.createElement("div");
      sectionTitle.className = "section-title";
      sectionTitle.innerHTML = `
        ${subCategoryName}
        <span class="arrow">▾</span>
      `;
      container.appendChild(sectionTitle);

      // 2. Dropdown Content
      const dropdownContent = document.createElement("div");
      dropdownContent.className = "dropdown-content";
      
      const inner = document.createElement("div");
      inner.className = "dropdown-inner";

      // 3. Dosyaları (Cards) Döngüye Al
      files.forEach(file => {
        const card = document.createElement("a");
        card.className = `menu-card ${file.disabled ? 'disabled' : ''}`;
        // Dosya yolunu oluştur: Kategori/AltKategori/DosyaID
        card.href = `#/studycards?data=${categoryKey}/${subCategoryName}/${file.id}`;
        
        card.innerHTML = `
          <h2>${file.title}</h2>
          <p>${file.desc}</p>
        `;
        inner.appendChild(card);
      });

      dropdownContent.appendChild(inner);
      container.appendChild(dropdownContent);
    });

    // Accordion Eventlerini Yeniden Bağla
    this.bindAccordionEvents();
  }

  // === ACCORDION LOGIC (Mevcut kodun dinamik elementlere uyarlanmış hali) ===
  static bindAccordionEvents() {
    const titles = document.querySelectorAll(".section-title");
    titles.forEach(title => {
      // Eski event listener'ları temizlemek için cloneNode yapılabilir ama
      // renderContent her seferinde yeni element yarattığı için gerek yok.
      
      title.addEventListener("click", () => {
        const content = title.nextElementSibling;
        const inner = content.querySelector(".dropdown-inner");
        const isOpen = title.classList.contains("open");

        if (isOpen) {
          // KAPAT
          const currentHeight = content.scrollHeight;
          content.style.height = currentHeight + "px";

          requestAnimationFrame(() => {
            content.style.height = "0px";
            content.style.opacity = "0";
          });

          title.classList.remove("open");

          const onCloseEnd = (e) => {
            if (e.propertyName === "height" && !title.classList.contains("open")) {
              content.style.height = "0px";
              content.removeEventListener("transitionend", onCloseEnd);
            }
          };
          content.addEventListener("transitionend", onCloseEnd);

        } else {
          // Önce diğer açıkları kapat
          titles.forEach(t => {
            if (t !== title && t.classList.contains("open")) {
              const c = t.nextElementSibling;
              c.style.height = c.scrollHeight + "px";
              requestAnimationFrame(() => {
                c.style.height = "0px";
                c.style.opacity = "0";
                t.classList.remove("open");
              });
            }
          });

          // AÇ
          title.classList.add("open");
          const fullHeight = inner.scrollHeight;

          content.style.opacity = "0";
          content.style.height = "0px";

          requestAnimationFrame(() => {
            content.style.height = fullHeight + "px";
            content.style.opacity = "1";
          });

          const onOpenEnd = (e) => {
            if (e.propertyName === "height" && title.classList.contains("open")) {
              content.style.height = "auto";
              content.removeEventListener("transitionend", onOpenEnd);
            }
          };
          content.addEventListener("transitionend", onOpenEnd);
        }
      });
    });
  }
}
