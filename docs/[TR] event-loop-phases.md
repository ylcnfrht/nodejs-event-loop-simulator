/**
 * EventLoopSimulator, Node.js event loop fazlarını ve callback kuyruklarını simüle eder.
 *
 * Bu simülasyon, Node.js event loop’unun temel fazlarını modelleyerek,
 * farklı türdeki geri çağrıların (callback) hangi sırayla çalıştırıldığını gösterir.
 *
 * Event loop fazları, her tick (döngü) içinde aşağıdaki sırayla işlenir:
 *
 * 1. nextTick            // process.nextTick, queueMicrotask gibi mikro görevler
 * 2. microtasks          // Promise geri çağrıları, async/await devamları vb.
 * 3. timers              // setTimeout, setInterval geri çağrıları
 * 4. pendingCallbacks     // Bazı TCP hataları gibi bekleyen I/O geri çağrıları
 * 5. idlePrepare         // Çoğunlukla dahili sistem görevleri için
 * 6. poll                // I/O geri çağrıları ve thread pool geri çağrıları
 * 7. check               // setImmediate geri çağrıları
 * 8. closeCallbacks      // Kapanış olayları

 * Fazlar
 * 1. nextTick callback'lerinin çalıştırılması (process.nextTick, queueMicrotask, vb.)
 *
 * nextTick fazında olanlar:
 *
 * - Bu faz, mevcut eşzamanlı işlem tamamlandıktan *hemen sonra* çalışır,
 *   event loop bir sonraki faza geçmeden önce gerçekleşir.
 * - process.nextTick() ile kaydedilen geri çağrılar burada yürütülür.
 * - queueMicrotask() geri çağrıları ve Promise mikro görevleri de bu faz civarında işlenir,
 *   ancak mikro görevler fazlar arasında biraz farklı şekilde ele alınır.
 * - nextTick geri çağrılarının önceliği diğer I/O veya timer geri çağrılarından yüksektir,
 *   yani herhangi bir timer, I/O veya setImmediate geri çağrısından önce mutlaka çalışır.
 * - Bu faz, kodu asenkron olarak ancak mümkün olan en kısa sürede çalıştırmak için planlamanızı sağlar,
 *   böylece diğer olayların çalışmasına izin vermeden event loop’un bir sonraki turuna ertelenir.
 * - process.nextTick fazlaca kullanılırsa I/O ve timer geri çağrılarının aç kalmasına sebep olabilir,
 *   bu da performans sorunlarına veya gelen isteklerin gecikmesine yol açabilir.
 *
 * Yaygın kullanım alanları:
 *
 * - Mevcut fonksiyon tamamlandıktan sonra ama herhangi bir I/O başlamadan önce işi ertelemek.
 * - CPU yoğun eşzamanlı kodu parçalara bölerek event loop’un duyarlı kalmasını sağlamak.
 * - Asenkron geri çağrıların timer veya I/O geri çağrılarından önce çalışmasını garanti etmek.
 *
 * Örnekler:
 *
 * 1. Temel nextTick geri çağrısı:
 *    process.nextTick(() => {
 *      console.log('nextTick geri çağrısı çalıştı');
 *    });
 *
 * 2. queueMicrotask kullanımı (benzer şekilde çalışır, ancak mikro görev kuyruğunda):
 *    queueMicrotask(() => {
 *      console.log('mikro görev geri çağrısı çalıştı');
 *    });
 *
 * 3. Promise.then geri çağrıları mikro görevdir ve mevcut fazdan hemen sonra çalışır:
 *    Promise.resolve().then(() => {
 *      console.log('Promise.then mikro görev çalıştı');
 *    });
 *
 * Özet:
 *
 * nextTick fazı, mevcut işlem hemen sonrası çalışan özel bir mikro görev kuyruğudur.
 * Diğer I/O veya timer olaylarından önce çalışacak geri çağrılar planlamanızı sağlar.
 * Yüksek öncelikli ertelemeler için faydalıdır ama event loop’un bloklanmaması için dikkatli kullanılmalıdır.
 *
 * ###########################################################################################
 *
  * 2. Mikrotask'lerin çalıştırılması (Promise geri çağrıları, async/await devamları, vb.)
 *
 * Mikro görev fazında olanlar:
 *
 * - Mikro görevler, mevcut işlem hemen ardından ve tüm `process.nextTick` geri çağrıları tamamlandıktan sonra,
 *   ancak event loop bir sonraki faza (timer, I/O vb.) geçmeden *önce* çalışan bir geri çağrı kuyruğudur.
 * - Mikro görevlerin yaygın kaynakları şunlardır:
 *    - Promise `.then()`, `.catch()`, `.finally()` geri çağrıları
 *    - Async/await devamları (bir `await` çözüldükten sonra)
 *    - queueMicrotask() çağrıları
 * - Mikro görevler, takip eden işleri hemen çalıştırmanızı sağlar,
 *   böylece diğer asenkron geri çağrılar başlamadan önce durum tutarlılığı sağlanır.
 * - Mikro görev kuyruğu tamamen işlenene kadar event loop devam etmez,
 *   eğer mikro görevler daha fazla mikro görev eklerse, bunlar da devam etmeden önce çalıştırılır.
 * - Bu durum, mikro görevler sürekli kendine yeni mikro görev eklerse,
 *   timer veya I/O işlemlerinin "aç kalmasına" (starvation) yol açabilir.
 * - Mikro görevlerin önceliği `process.nextTick`’ten biraz düşüktür,
 *   ancak timer, I/O ve setImmediate geri çağrılarından daha yüksektir.
 *
 * Yaygın kullanım alanları:
 *
 * - Promise zincirleme asenkron işlemleri.
 * - Asenkron bir işlem çözüldükten hemen sonra takip eden kodu çalıştırmak.
 * - Bazı işlemleri mevcut çağrı yığını tamamlandıktan sonra ama I/O’dan önce ertelemek.
 *
 * Örnekler:
 *
 * 1. Promise mikro görev örneği:
 *    Promise.resolve().then(() => {
 *      console.log('Promise geri çağrısı çalıştı');
 *    });
 *
 * 2. Async/await devamı:
 *    async function foo() {
 *      await Promise.resolve();
 *      console.log('Async fonksiyon devamı çalıştı');
 *    }
 *    foo();
 *
 * 3. queueMicrotask kullanımı:
 *    queueMicrotask(() => {
 *      console.log('queueMicrotask geri çağrısı çalıştı');
 *    });
 *
 * Özet:
 *
 * Mikro görev fazı, `process.nextTick` geri çağrılarından sonra ve
 * event loop’un bir sonraki fazından önce çalışır. Promise ve async/await
 * gibi yüksek öncelikli asenkron geri çağrıların mümkün olan en kısa sürede
 * çalışmasını sağlar. Mikro görevlerin doğru kullanımı, asenkron kodun
 * zamanında çalışmasını sağlarken diğer I/O veya timer olaylarının bloklanmasını engeller.
 *
 * ###########################################################################################
 *
  * 3. Timer fazını çalıştırma (setTimeout, setInterval geri çağrıları)
 *
 * Timer fazında olanlar:
 *
 * - Bu faz, zamanlayıcısı dolan `setTimeout()` ve `setInterval()` ile
 *   planlanmış geri çağrıları çalıştırır.
 * - Sadece süresi dolmuş zamanlayıcıların geri çağrıları bu fazda çalıştırılır.
 * - Sıfır gecikmeli zamanlayıcılar (`setTimeout(fn, 0)`) hemen çalıştırılmak zorunda değildir;
 *   event loop timer fazına geldiğinde ve zamanlayıcı süresi dolduğunda çalıştırılırlar.
 * - Timerlar, her event loop döngüsünde bir kez kontrol edilir ve çalıştırılır.
 * - Eğer bir timer callback yeni timerlar oluşturursa, bu yeni timerlar
 *   o anki döngüde değil, zamanları geldiğinde sonraki döngülerde çalışır.
 * - Callback süresi uzun olursa, sonraki fazların gecikmesine ve I/O veya diğer
 *   event loop fazlarının aç kalmasına (starvation) sebep olabilir.
 *
 * Tipik kullanım alanları:
 *
 * - Belirli bir süre sonra fonksiyonun ertelenmiş çalıştırılması.
 * - Belirli aralıklarla fonksiyonun tekrar tekrar çalıştırılması (`setInterval`).
 * - Gecikmeli yeniden deneme (retry) mekanizmalarının uygulanması.
 *
 * Örnekler:
 *
 * 1. Basit setTimeout:
 *    setTimeout(() => {
 *      console.log('timeout callback, gecikmeden sonra çalıştı');
 *    }, 1000); // yaklaşık 1 saniye sonra çalışır
 *
 * 2. Sıfır gecikmeli timer:
 *    setTimeout(() => {
 *      console.log('0ms gecikmeli timeout');
 *    }, 0);
 *
 * 3. setInterval örneği:
 *    let count = 0;
 *    const intervalId = setInterval(() => {
 *      console.log('interval callback çalıştı', ++count);
 *      if (count >= 5) clearInterval(intervalId);
 *    }, 500); // her 500ms’de bir çalışır, 5 kere sonra durur
 *
 * Özet:
 *
 * Timer fazı, süresi dolmuş `setTimeout` ve `setInterval` ile planlanmış
 * geri çağrıları çalıştırır. Zaman tabanlı kodların ertelenmesi veya tekrarlanması
 * için ana mekanizmadır.
 *
 * ###########################################################################################
 *
 * 4. Pending callbacks fazının çalıştırılması (bazı I/O callback'leri gibi)
 *
 * Bu fazda neler olur:
 *
 * - Bazı sistem seviyesindeki işlemler ve daha önceki fazlardan ertelenmiş bazı
 *   I/O olaylarının geri çağrıları burada çalıştırılır.
 * - TCP hataları veya doğrudan poll fazına uymayan diğer ağla ilgili olayların
 *   geri çağrıları burada işlenir.
 * - Platforma özgü bazı geri çağrılar (örneğin bazı TCP hataları) bu fazda ele alınır.
 * - Kullanıcı kodunda doğrudan çok sık etkileşime girilmez ancak belirli kenar
 *   durumlarındaki asenkron I/O işlemleri için önemlidir.
 *
 * Örnekler:
 *
 * 1. Dosya sistemi okuma geri çağrısı (zamanlamaya göre burda veya poll fazında işlenebilir):
 *    fs.readFile('file.txt', (err, data) => {
 *      if (err) throw err;
 *      console.log('Dosya okuma callback çalıştı');
 *    });
 *
 * 2. TCP soket hatalarının yönetimi:
 *    const net = require('net');
 *    const server = net.createServer((socket) => {
 *      socket.on('error', (err) => {
 *        console.error('TCP soket hatası:', err);
 *      });
 *    });
 *    server.listen(3000);
 *
 * Özet:
 *
 * Pending callbacks fazı, TCP hataları ve diğer ertelenmiş düşük seviyeli sistem
 * işlemlerinin geri çağrılarıyla ilgilenir. Event loop içinde dar ve özel bir fazdır.
 *
 * ###########################################################################################
 *
 * 5. Idle fazının çalıştırılması (çoğunlukla sistem içi işlemler için)
 *
 * Bu fazda neler olur:
 *
 * - Node.js ve libuv tarafından sistem bakımı ve iç işleyiş görevleri için kullanılır.
 * - Kullanıcı koduna doğrudan açık değildir, kullanıcı geri çağrıları burada çalışmaz.
 * - Event loop’un sonraki fazlara hazırlanması ve iç kaynak yönetimi için çalışır.
 * - Kaynak temizleme, handle yönetimi, timer hazırlığı gibi görevler yapılır.
 *
 * Özellikleri:
 *
 * - Geliştiriciler için genellikle görünmez.
 * - Kullanıcı kayıtlı geri çağrıları içermez.
 * - Event loop boşta kaldığında çalışır, sistem kaynaklarının verimli kullanılmasını sağlar.
 *
 * Örnek:
 *
 * - Kullanıcı düzeyinde doğrudan erişim veya callback yoktur.
 * - Node.js runtime ve libuv tarafından otomatik yönetilir.
 *
 * Özet:
 *
 * Idle fazı, Node.js içinde sistem kaynaklarını hazırlamak ve event loop’un
 * sağlıklı çalışmasını sağlamak için kullanılan düşük seviyeli bir bakım fazıdır.
 * Kullanıcı uygulamalarıyla doğrudan etkileşimi yoktur.
 *
 * ###########################################################################################
 *
  * 6. Poll fazının çalıştırılması (I/O callback'leri ve thread pool callback'leri)
 *
 * Node.js event loop’unun en ana ve en yoğun fazıdır.
 *
 * Bu fazda neler olur:
 *
 * - Node.js’deki asenkron I/O işlemlerinin büyük çoğunluğu burada işlenir.
 * - Dosya sistemi okuma/yazma, ağ iletişimi, asenkron veritabanı sorguları gibi tamamlanan
 *   I/O operasyonlarının callback’leri burada tetiklenir.
 * - Örnek I/O işlemleri:
 *    - fs modülü ile dosya işlemleri (fs.readFile, fs.writeFile vb.)
 *    - Ağ iletişimi: TCP, UDP, HTTP istekleri (gelen/giden)
 *    - DNS çözümlemeleri
 *    - libuv thread pool’da çalışan kriptografik işlemler (hashing, pbkdf2 vb.)
 *    - Asenkron DB sorgularının callback’leri (MySQL, MongoDB, PostgreSQL, Redis)
 * - Gelen ağ istekleri (örneğin Express veya http server’dan gelen HTTP istekleri) burada işlenir.
 * - Giden HTTP istekleri uygulama kodunda başlatılır, fakat gelen yanıtın callback’i poll fazında çalışır.
 * - Eğer poll kuyruğu boşsa ve zamanlayıcılar varsa event loop, gereksiz beklememek için
 *   timers fazına erken geçer.
 * - Eğer kuyruğun da zamanlayıcının da olmadığı durumda poll fazı beklemeye (bloklamaya) geçer,
 *   yeni olayların gelmesini bekler.
 * - Her poll callback’inden sonra microtask kuyruğu (Promise callback’leri, async/await devamları)
 *   işlenir, sonra diğer poll callback’ine geçilir.
 * - Poll fazı, kuyruğun boşalması veya o tick için izin verilen callback’ler işlendikten sonra biter.
 * - Poll fazı bittikten sonra event loop, setImmediate callback’lerinin çalıştığı check fazına geçer.
 *
 * Detaylı örnekler:
 *
 * 1. Dosya okuma (fs.readFile):
 *    Kullanıcı kodu ile başlatılan bu asenkron işlem tamamlandığında callback poll fazında çalışır.
 *
 *    fs.readFile('example.txt', (err, data) => {
 *      if (err) throw err;
 *      console.log('Dosya okuma tamamlandı:', data.toString());
 *    });
 *
 * 2. Gelen HTTP isteği (Express/http server):
 *    Bir istemci HTTP isteği gönderdiğinde OS/network yığını Node.js’ye iletir,
 *    Express veya native http server callback’i poll fazında tetikler.
 *
 *    const express = require('express');
 *    const app = express();
 *    app.get('/', (req, res) => {
 *      res.send('Poll fazından merhaba!');
 *    });
 *    app.listen(3000);
 *
 * 3. Giden HTTP isteği:
 *    Uygulamanız dış servise HTTP isteği gönderir, yanıt geldiğinde callback poll fazında çalışır.
 *
 *    const http = require('http');
 *    http.get('http://jsonplaceholder.typicode.com/todos/1', (response) => {
 *      let data = '';
 *      response.on('data', chunk => data += chunk);
 *      response.on('end', () => {
 *        console.log('Giden HTTP isteği tamamlandı:', data);
 *      });
 *    });
 *
 * 4. Veritabanı sorgusu:
 *    Asenkron DB sorgusu tamamlandığında callback poll fazında tetiklenir.
 *
 *    simulateDatabaseQuery((result) => {
 *      console.log('DB sorgu sonucu:', result);
 *    });
 *
 * 5. libuv thread pool’da çalışan kripto işlemi:
 *    Yoğun CPU işi olan pbkdf2 gibi işlemler libuv thread pool’a gönderilir,
 *    tamamlandığında callback poll fazında çalışır.
 *
 *    const crypto = require('crypto');
 *    crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', () => {
 *      console.log('Crypto pbkdf2 callback tetiklendi');
 *    });
 *
 * Özet:
 *
 * Poll fazı Node.js’nin asenkron I/O işlemlerinin kalbidir.
 * Çoğu I/O callback’i burada işlenir, gelen ağ istekleri burada ele alınır,
 * giden isteklerin yanıtları burada tetiklenir.
 * Bu fazı iyi anlamak, etkin asenkron kod yazmak ve event loop performansını anlamak
 * için kritiktir.
 * 
 * ############################################################################################# 
 *
  * 7. Check fazının çalıştırılması (setImmediate callback'leri)
 *
 * Bu fazda neler olur:
 *
 * - setImmediate() ile planlanan callback’ler burada çalıştırılır.
 * - setImmediate callback’leri poll fazı tamamlandıktan hemen sonra tetiklenir.
 * - setTimeout veya setInterval gibi zamanlayıcılardan farklı olarak,
 *   setImmediate callback’leri timer süresi dolmasını beklemeden, I/O işleminden sonra hemen çalışır.
 * - I/O işlemlerinden sonra ama timer callback’lerinden önce çalışacak kodlar için uygundur.
 *
 * Özellikler:
 *
 * - setImmediate() ile kuyruğa alınan callback’ler sadece bu fazda çalıştırılır.
 * - I/O işlemlerinden hemen sonra yapılması gereken işleri burada yapabilirsiniz.
 * - Her event loop döngüsünde poll fazı bitince, check fazı çalışır ve setImmediate callback’leri işlenir.
 *
 * Örnek:
 *
 * setImmediate(() => {
 *   console.log('setImmediate callback çalıştı');
 * });
 *
 * Bu callback, poll fazındaki tüm I/O callback’leri tamamlandıktan sonra çalışır.
 *
 * Özet:
 *
 * Check fazı, setImmediate callback’lerini yönetir ve poll fazından hemen sonra
 * çalıştırarak, I/O işlemlerinden sonra yapılacak işleri kolaylaştırır.
 *
 * ############################################################################################# 
 *
 * 8. Close callbacks fazının çalıştırılması (socket close event’leri vb.)
 *
 * Bu fazda neler olur:
 *
 * - Bu faz, socket, server veya diğer kaynaklar kapatıldığında tetiklenen cleanup callback’lerini çalıştırır.
 * - Bir TCP socket veya server kapandığında, ‘close’ eventi yayımlanır ve ilgili callback’ler burada çalıştırılır.
 * - Kaynakların düzgün şekilde temizlenmesini sağlar ve kapanmadan önce gerekli son işlemlere izin verir.
 *
 * Özellikler:
 *
 * - Genellikle socket, server veya stream’lerdeki ‘close’ event handler’larını içerir.
 * - Kapatılan handle tamamen kapanıp, tüm bekleyen I/O ve callback’ler tamamlandıktan sonra çağrılır.
 * - Kaynakların serbest bırakılması, loglama veya bağlı işlemlerin tetiklenmesi için kullanılır.
 *
 * Örnek:
 *
 * const net = require('net');
 * const server = net.createServer((socket) => {
 *   socket.on('close', () => {
 *     console.log('Socket kapandı');
 *   });
 *   socket.end();
 * });
 *
 * server.listen(3000, () => {
 *   console.log('Server başlatıldı');
 *   server.close(() => {
 *     console.log('Server kapandı');
 *   });
 * });
 *
 * Bu örnekte, socket ve server’ın ‘close’ event callback’leri close callbacks fazında çalıştırılır.
 *
 * Özet:
 *
 * Close callbacks fazı, kapanan handle’lar için cleanup callback’lerinin çalıştırıldığı,
 * kaynak yönetimi ve temizliği için ayrılmış event loop fazıdır.
 *