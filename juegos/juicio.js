/* El juicio de las almas — Anubis pesa fragmentos de código.
   Si el alma es limpia, pasa al más allá; si tiene un fallo, se la come Ammit. Señalar la línea exacta del fallo da bonus.
   Cada fragmento tiene la línea con fallo (bug, desde 0) o -1 si es correcto, y una explicación. */
(function(){
'use strict';
const ROUNDS=12,LIVES=3;
const SOULS=[
 /* JavaScript */
 {lang:'JavaScript',lv:1,bug:2,code:['function sum(nums) {','  let total = 0;','  for (let i = 0; i <= nums.length; i++) {','    total += nums[i];','  }','  return total;','}'],why:'Con <= se lee una posición fuera del array: nums[nums.length] es undefined y la suma da NaN. Debe ser i < nums.length.'},
 {lang:'JavaScript',lv:1,bug:-1,code:['const unique = arr => [...new Set(arr)];','console.log(unique([1, 2, 2, 3])); // [1, 2, 3]'],why:'Correcto: un Set elimina los duplicados y el spread lo vuelve a convertir en array.'},
 {lang:'JavaScript',lv:3,bug:2,code:['async function loadAll(ids) {','  const users = [];','  ids.forEach(async id => {','    users.push(await fetchUser(id));','  });','  return users;','}'],why:'forEach no espera a las funciones async: la función devuelve el array vacío antes de que lleguen los usuarios. Usa for...of con await o Promise.all.'},
 {lang:'JavaScript',lv:1,bug:-1,code:['function isEven(n) {','  return n % 2 === 0;','}'],why:'Correcto: el resto entre 2 es 0 para los pares y se compara con igualdad estricta.'},
 {lang:'JavaScript',lv:1,bug:2,code:['const price = "10";','const qty = 3;','const total = price + qty;','console.log(total); // esperado 13'],why:'price es un texto, así que + concatena y da "103". Hay que convertirlo antes: Number(price) + qty.'},
 {lang:'JavaScript',lv:2,bug:-1,code:['const user = { name: "Max", langs: ["js", "java"] };','const copy = structuredClone(user);','copy.langs.push("kotlin");','console.log(user.langs.length); // 2'],why:'Correcto: structuredClone hace una copia profunda, así que el array del original no cambia.'},
 {lang:'JavaScript',lv:2,bug:0,code:['for (var i = 0; i < 3; i++) {','  setTimeout(() => console.log(i), 0);','}','// esperado: 0 1 2'],why:'var comparte la misma variable en todas las vueltas: cuando se ejecutan los setTimeout vale 3 y se imprime 3 3 3. Con let cada vuelta tiene su propia i.'},
 /* Java */
 {lang:'Java',lv:1,bug:2,code:['String a = new String("anubis");','String b = "anubis";','if (a == b) {','    System.out.println("Iguales");','}'],why:'== compara si son el mismo objeto, no el contenido. Aquí son objetos distintos y no imprime nada. Se usa a.equals(b).'},
 {lang:'Java',lv:1,bug:-1,code:['List<Integer> nums = List.of(3, 1, 2);','List<Integer> sorted = new ArrayList<>(nums);','Collections.sort(sorted);','System.out.println(sorted); // [1, 2, 3]'],why:'Correcto: List.of es inmutable, por eso se copia a un ArrayList antes de ordenar.'},
 {lang:'Java',lv:1,bug:1,code:['int[] arr = {1, 2, 3};','for (int i = 1; i <= arr.length; i++) {','    System.out.println(arr[i]);','}'],why:'Empieza en 1 (se salta el primer elemento) y llega hasta arr.length, que lanza ArrayIndexOutOfBoundsException. Debe ir de 0 a i < arr.length.'},
 {lang:'Java',lv:3,bug:3,code:['List<String> gods = new ArrayList<>(','    List.of("Set", "Ra", "Isis", "Nut"));','for (String g : gods) {','    if (g.startsWith("S")) gods.remove(g);','}'],why:'Borrar elementos de una lista mientras se recorre con for-each lanza ConcurrentModificationException. Usa gods.removeIf(g -> g.startsWith("S")).'},
 {lang:'Java',lv:2,bug:-1,code:['Optional<String> god = Optional.ofNullable(findGod("Thot"));','System.out.println(god.orElse("Desconocido"));'],why:'Correcto: Optional evita el NullPointerException y orElse da un valor por defecto.'},
 {lang:'Java',lv:2,bug:1,code:['double avg(int a, int b) {','    return (a + b) / 2;','}','// avg(3, 4) devuelve 3.0'],why:'(a + b) / 2 es una división entera: 7 / 2 = 3, y luego se convierte a 3.0. Hay que dividir entre 2.0.'},
 /* Python */
 {lang:'Python',lv:2,bug:0,code:['def add_item(item, items=[]):','    items.append(item)','    return items'],why:'La lista por defecto se crea una sola vez y se comparte entre llamadas: los elementos se acumulan. Usa items=None y crea la lista dentro.'},
 {lang:'Python',lv:1,bug:-1,code:['squares = {n: n * n for n in range(1, 4)}','print(squares)  # {1: 1, 2: 4, 3: 9}'],why:'Correcto: comprensión de diccionario con range(1, 4), que llega hasta el 3.'},
 {lang:'Python',lv:3,bug:3,code:['nums = [2, 4, 6, 7]','for n in nums:','    if n % 2 == 0:','        nums.remove(n)','print(nums)  # esperado [7]'],why:'Borrar de la lista mientras se recorre hace que se salte elementos: el resultado es [4, 7]. Mejor crear una lista nueva: [n for n in nums if n % 2].'},
 {lang:'Python',lv:1,bug:-1,code:['with open("datos.txt", encoding="utf-8") as f:','    lines = [l.strip() for l in f]','print(len(lines))'],why:'Correcto: with cierra el archivo solo y se indica la codificación.'},
 {lang:'Python',lv:2,bug:1,code:['def is_admin(user):','    if user.role is "admin":','        return True','    return False'],why:'is compara identidad de objetos, no igualdad de texto: puede fallar aunque el rol sea "admin". Se usa ==.'},
 {lang:'Python',lv:1,bug:1,code:['total = 0','for i in range(1, 10):','    total += i','print(total)  # suma del 1 al 10 = 55'],why:'range(1, 10) no incluye el 10: suma 45. Debe ser range(1, 11).'},
 /* SQL */
 {lang:'SQL',lv:1,bug:2,code:['-- Desactivar solo al usuario 42','UPDATE usuarios','SET activo = 0;'],why:'Falta el WHERE: se desactivan todos los usuarios. Debe ser SET activo = 0 WHERE id = 42.'},
 {lang:'SQL',lv:2,bug:-1,code:['SELECT dios, COUNT(*) AS templos','FROM templos','GROUP BY dios','HAVING COUNT(*) > 2;'],why:'Correcto: HAVING filtra después de agrupar.'},
 {lang:'SQL',lv:2,bug:2,code:['SELECT nombre, MAX(nota)','FROM alumnos','WHERE MAX(nota) > 9;'],why:'No se pueden usar funciones de agregado en WHERE. Hay que agrupar con GROUP BY nombre y filtrar con HAVING MAX(nota) > 9.'},
 {lang:'SQL',lv:2,bug:2,code:['SELECT *','FROM pedidos','WHERE cupon = NULL;'],why:'Nada es igual a NULL, ni siquiera NULL: la consulta nunca devuelve filas. Se escribe WHERE cupon IS NULL.'},
 {lang:'SQL',lv:1,bug:-1,code:['SELECT u.nombre, p.total','FROM usuarios u','JOIN pedidos p ON p.usuario_id = u.id','WHERE p.total > 100;'],why:'Correcto: JOIN por la clave ajena y filtro sobre el total.'},
 {lang:'SQL',lv:1,bug:-1,code:['DELETE FROM sesiones','WHERE caduca_en < CURRENT_TIMESTAMP;'],why:'Correcto: borra solo las sesiones caducadas gracias al WHERE.'},
 /* C# */
 {lang:'C#',lv:1,bug:1,code:['int a = 7, b = 2;','double r = a / b;','Console.WriteLine(r); // esperado 3.5'],why:'a / b es una división entera (da 3) antes de guardarse en el double. Hay que convertir uno de los dos: (double)a / b.'},
 {lang:'C#',lv:1,bug:-1,code:['var names = new List<string> { "Ra", "Nut", "Geb" };','var shortNames = names.Where(n => n.Length == 2).ToList();','Console.WriteLine(shortNames.Count); // 1'],why:'Correcto: solo "Ra" tiene dos letras.'},
 {lang:'C#',lv:1,bug:1,code:['string text = null;','if (text.Length > 0)','{','    Console.WriteLine(text);','}'],why:'Acceder a Length de un null lanza NullReferenceException. Usa string.IsNullOrEmpty(text).'},
 {lang:'C#',lv:2,bug:-1,code:['using var reader = new StreamReader("log.txt");','string first = reader.ReadLine() ?? "(vacío)";','Console.WriteLine(first);'],why:'Correcto: using libera el archivo y ?? da un valor si la línea es null.'},
 {lang:'C#',lv:3,bug:2,code:['var actions = new List<Action>();','for (int i = 0; i < 3; i++)','    actions.Add(() => Console.WriteLine(i));','foreach (var a in actions) a(); // esperado 0 1 2'],why:'La lambda captura la variable i del bucle, no su valor: al ejecutarse vale 3 e imprime 3 3 3. Hay que copiarla antes: int copia = i;'},
 {lang:'C#',lv:1,bug:-1,code:['decimal price = 19.99m;','decimal total = price * 3;','Console.WriteLine(total); // 59.97'],why:'Correcto: decimal es el tipo adecuado para dinero, sin errores de redondeo binario.'},
 /* Kotlin */
 {lang:'Kotlin',lv:1,bug:1,code:['val name: String? = null','println(name!!.length)'],why:'!! fuerza a usar un valor que puede ser null y lanza NullPointerException. Usa name?.length ?: 0.'},
 {lang:'Kotlin',lv:1,bug:-1,code:['val gods = listOf("Ra", "Thot", "Isis")','val longNames = gods.filter { it.length > 2 }','println(longNames) // [Thot, Isis]'],why:'Correcto: filter devuelve una lista nueva con los nombres de más de dos letras.'},
 {lang:'Kotlin',lv:1,bug:1,code:['val list = listOf(1, 2, 3)','list.add(4)'],why:'listOf crea una lista de solo lectura: no tiene add y no compila. Hay que usar mutableListOf.'},
 {lang:'Kotlin',lv:2,bug:-1,code:['data class Carta(val valor: Int, val palo: String)','val a = Carta(10, "ankh")','val b = Carta(10, "ankh")','println(a == b) // true'],why:'Correcto: en las data class, == compara el contenido.'},
 {lang:'Kotlin',lv:2,bug:1,code:['fun factorial(n: Int): Int {','    return n * factorial(n - 1)','}'],why:'No hay caso base: la recursión no termina nunca y acaba en StackOverflowError. Falta if (n <= 1) return 1.'},
 {lang:'Kotlin',lv:1,bug:-1,code:['val edad = 20','val etapa = when {','    edad < 18 -> "menor"','    else -> "adulto"','}','println(etapa) // adulto'],why:'Correcto: when como expresión con rama else.'},
 /* PHP */
 {lang:'PHP',lv:1,bug:1,code:['$items = ["papiro", "pluma"];','for ($i = 0; $i <= count($items); $i++) {','    echo $items[$i];','}'],why:'Con <= se intenta leer $items[2], que no existe (aviso de clave indefinida). Debe ser $i < count($items).'},
 {lang:'PHP',lv:2,bug:-1,code:['$nombre = htmlspecialchars($_GET["nombre"] ?? "", ENT_QUOTES, "UTF-8");','echo "Hola, $nombre";'],why:'Correcto: se escapa la entrada del usuario antes de mostrarla, así se evita el XSS.'},
 {lang:'PHP',lv:2,bug:1,code:['$id = $_GET["id"];','$sql = "SELECT * FROM usuarios WHERE id = $id";','$res = $pdo->query($sql);'],why:'Meter la entrada del usuario directamente en la consulta permite inyección SQL. Hay que usar consultas preparadas.'},
 {lang:'PHP',lv:3,bug:0,code:['if (strpos("anubis", "a")) {','    echo "Contiene la a";','}'],why:'strpos devuelve 0 porque la "a" está en la primera posición, y 0 cuenta como falso: no imprime nada. Hay que comparar con !== false.'},
 {lang:'PHP',lv:1,bug:-1,code:['$stmt = $pdo->prepare("SELECT * FROM templos WHERE id = ?");','$stmt->execute([$id]);','$templo = $stmt->fetch();'],why:'Correcto: consulta preparada, sin riesgo de inyección SQL.'},
 {lang:'PHP',lv:1,bug:-1,code:['$hash = password_hash($pass, PASSWORD_DEFAULT);','if (password_verify($pass, $hash)) {','    echo "Contraseña correcta";','}'],why:'Correcto: así se guardan y comprueban contraseñas en PHP, nunca en texto plano.'}];

const KW={
 JavaScript:'const let var function return for of in if else async await new class true false null undefined',
 Java:'String int double boolean new if else for return public private static void class true false null List Optional',
 Python:'def return for in if else elif with as print import from True False None is not and or range',
 SQL:'SELECT FROM WHERE UPDATE SET DELETE INSERT INTO VALUES JOIN ON GROUP BY HAVING ORDER AS COUNT MAX IS NULL AND OR',
 'C#':'int double decimal string var new if else for foreach in using return true false null List Action',
 Kotlin:'val var fun return if else when data class true false null listOf mutableListOf println',
 PHP:'if for echo foreach as true false null new return'};
const CMT={JavaScript:'//',Java:'//','C#':'//',Kotlin:'//',PHP:'//',Python:'#',SQL:'--'};
function hl(line,lang){const esc=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const kws=KW[lang].split(' ').map(k=>k.replace(/[#]/g,'\\#')).join('|');
  const cm=CMT[lang].replace(/[-/#]/g,m=>'\\'+m);
  const re=new RegExp('('+cm+'.*$)|("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\')|(\\$[A-Za-z_]\\w*)|\\b('+kws+')\\b|(\\b\\d+(?:\\.\\d+)?\\b)','g');
  let out='',last=0,m;while((m=re.exec(line))){out+=esc(line.slice(last,m.index));
    const t=esc(m[0]);out+=m[1]?'<i class="c">'+t+'</i>':m[2]?'<i class="s">'+t+'</i>':m[3]?'<i class="v">'+t+'</i>':m[4]?'<i class="k">'+t+'</i>':'<i class="n">'+t+'</i>';
    last=m.index+m[0].length;if(m[0]==='')re.lastIndex++}
  return out+esc(line.slice(last))}

const FEATHER='<path d="M7.4 23.4C5.3 15.6 5.9 7.4 11.5 2.3c2.9-2.5 8.4-2.2 8.6.5.1 1.3-1 1.8-2.3 1.7-1.6 2.3-1.9 5.6-1.6 9.1.3 3.6-.3 6.9-1.8 9.8z" fill="#F4EFE3" stroke="#0A0A08" stroke-width="1.4"/><path d="M10.6 22.6c-.2-7.2.6-13 4-17.9" stroke="#C9A227" stroke-width="1.1" fill="none"/>';
const HEART='<path d="M12 21C5 16 2 12.2 2 8.4 2 5.4 4.4 3 7.3 3c2 0 3.6 1 4.7 2.6C13.1 4 14.7 3 16.7 3 19.6 3 22 5.4 22 8.4c0 3.8-3 7.6-10 12.6z" fill="#A8361C" stroke="#0A0A08" stroke-width="1.6"/><path d="M6.2 6.4c-1.3.6-2 1.8-2 3" stroke="#F4EFE3" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>';

const CSS=`
.jc-wrap{position:absolute;left:0;right:0;top:64px;bottom:calc(86px + var(--ab));container-type:size}
.jc-deco{position:absolute;inset:-64px 0 0;pointer-events:none;background:repeating-linear-gradient(118deg,transparent 0 38px,rgba(122,92,30,.12) 38px 40px)}
.jc-deco::before{content:"";position:absolute;left:30%;top:-10%;width:40%;height:90%;background:radial-gradient(ellipse at 50% 30%,rgba(245,200,66,.14),transparent 65%)}
.jc-main{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,.72fr) minmax(0,1.9fr) minmax(0,.62fr);gap:clamp(10px,1.6cqw,24px);padding:0 max(16px,env(safe-area-inset-right,0px)) 0 max(16px,env(safe-area-inset-left,0px));align-items:end}
.jc-anubis{position:relative;align-self:end;height:100%;display:flex;flex-direction:column;justify-content:flex-end}
.jc-anubis img{display:block;width:100%;max-height:82cqh;object-fit:contain;object-position:bottom;filter:drop-shadow(0 0 14px rgba(245,200,66,.2));transition:transform .3s}
.jc-anubis.angry img{animation:jcShake .45s}
@keyframes jcShake{20%,60%{transform:translateX(-6px) rotate(-1deg)}40%,80%{transform:translateX(6px) rotate(1deg)}}
.jc-say{position:absolute;left:0;right:-10%;top:3%;z-index:3;font:600 clamp(12px,1.25cqw,15px)/1.32 var(--f-ui);background:var(--ivory);color:var(--ink);padding:8px 11px 7px;transform:skewX(-8deg);box-shadow:4px 4px 0 var(--gold);animation:tcPop .3s cubic-bezier(.3,1.8,.5,1) both}
.jc-say::before{content:"ANUBIS";display:block;font:700 9px/1 var(--f-ui);letter-spacing:.3em;color:var(--bronze);margin-bottom:3px}
.jc-center{display:flex;flex-direction:column;gap:clamp(8px,1.4cqh,14px);min-width:0;height:100%;justify-content:center}
.jc-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.jc-lives{display:flex;gap:4px}
.jc-lives svg{width:clamp(20px,2.2cqw,28px);height:auto;transition:transform .3s,opacity .3s}
.jc-lives svg.lost{opacity:.18;transform:scale(.8);filter:grayscale(1)}
.jc-round{font:400 clamp(15px,1.6cqw,20px)/1 var(--f-cond);letter-spacing:.08em;color:var(--ink);background:var(--ivory);padding:5px 10px 4px;transform:skewX(-10deg);box-shadow:3px 3px 0 var(--gold)}
.jc-streak{font:400 clamp(15px,1.6cqw,20px)/1 var(--f-cond);letter-spacing:.08em;color:var(--ink);background:var(--gold-hi);padding:5px 10px 4px;transform:skewX(-10deg);box-shadow:3px 3px 0 var(--ink)}
.jc-streak:empty{display:none}
.jc-scale{margin-left:auto;width:clamp(120px,15cqw,190px);height:auto;overflow:visible}
.jc-beam{transform-box:view-box;transform-origin:100px 34px;transition:transform .7s cubic-bezier(.3,1.5,.5,1)}
.jc-pan{transform-box:view-box;transition:transform .7s cubic-bezier(.3,1.5,.5,1)}
.jc-scroll{position:relative;background:repeating-linear-gradient(0deg,rgba(122,92,30,.08) 0 2px,transparent 2px 7px),var(--papyrus);color:var(--ink);box-shadow:8px 8px 0 rgba(201,162,39,.85),0 0 0 2px var(--ink);padding:clamp(12px,1.6cqw,20px) clamp(12px,1.6cqw,20px) clamp(10px,1.2cqw,14px);min-height:0}
.jc-scroll::before,.jc-scroll::after{content:"";position:absolute;left:-8px;right:-8px;height:12px;background:linear-gradient(#7A5C1E,#C9A227 40%,#7A5C1E);border-radius:6px;box-shadow:0 0 0 2px var(--ink)}
.jc-scroll::before{top:-8px}.jc-scroll::after{bottom:-8px}
.jc-scroll.in{animation:jcIn .45s cubic-bezier(.2,.9,.3,1.1)}
@keyframes jcIn{from{clip-path:inset(0 0 100% 0);transform:translateY(-10px)}to{clip-path:inset(0 0 0 0)}}
.jc-meta{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.jc-lang{font:700 10px/1 var(--f-ui);letter-spacing:.24em;color:var(--ivory);background:var(--lapis);padding:5px 8px 4px;transform:skewX(-10deg)}
.jc-q{font:600 12px/1.2 var(--f-ui);color:rgba(10,10,8,.65)}
.jc-timer{margin-left:auto;width:clamp(80px,12cqw,150px);height:7px;background:rgba(10,10,8,.15);transform:skewX(-20deg);overflow:hidden}
.jc-timer i{display:block;height:100%;background:linear-gradient(90deg,#A8361C,#C9A227 40%,#C9A227);transform-origin:left}
.jc-code{margin:0;padding:0;list-style:none;font:500 clamp(12px,1.55cqw,18px)/1.6 var(--f-mono);font-variant-ligatures:none;font-feature-settings:"liga" 0,"calt" 0;counter-reset:ln;overflow:auto;max-height:46cqh}
.jc-code li{position:relative;display:block;padding:1px 8px 1px 40px;white-space:pre;cursor:pointer;border-radius:2px;counter-increment:ln;transition:background .12s}
.jc-code li::before{content:counter(ln);position:absolute;left:4px;width:26px;text-align:right;color:rgba(10,10,8,.35)}
.jc-code li:hover,.jc-code li:focus-visible{background:rgba(201,162,39,.32);outline:none}
.jc-code li.sel{background:rgba(201,162,39,.45);box-shadow:inset 3px 0 0 var(--gold)}
.jc-code li.bad{background:rgba(168,54,28,.22);box-shadow:inset 4px 0 0 #A8361C}
.jc-code li.bad::after{content:"𓆣 AQUÍ";position:absolute;right:6px;top:50%;transform:translateY(-50%);font:700 9px/1 var(--f-ui);letter-spacing:.18em;color:#A8361C}
.jc-code li.wrong{background:rgba(10,10,8,.12);text-decoration:line-through;text-decoration-color:rgba(10,10,8,.4)}
.jc-code.locked li{cursor:default}
.jc-code i{font-style:normal}.jc-code i.k{color:#1c4fa8;font-weight:700}.jc-code i.s{color:#A8361C}.jc-code i.c{color:#7A5C1E;font-style:italic}.jc-code i.n{color:#14705C}.jc-code i.v{color:#6b2f8a}
.jc-why{margin-top:10px;padding-top:8px;border-top:1px dashed rgba(10,10,8,.3);font:500 clamp(12.5px,1.3cqw,15px)/1.45 var(--f-ui);color:rgba(10,10,8,.85)}
.jc-why b{font:400 1.15em/1 var(--f-cond);letter-spacing:.06em;margin-right:8px}
.jc-why b.ok{color:#14705C}.jc-why b.ko{color:#A8361C}
.jc-why:empty{display:none}
.jc-hint{font:600 12px/1.3 var(--f-ui);color:rgba(244,239,227,.6)}
.jc-ammit{position:relative;align-self:end;display:flex;justify-content:center}
.jc-ammit img{display:block;width:100%;max-height:60cqh;object-fit:contain;object-position:bottom;transform-origin:50% 100%;filter:drop-shadow(0 0 12px rgba(0,0,0,.6))}
.jc-ammit.idle img{animation:jcIdle 2.2s ease-in-out infinite}
@keyframes jcIdle{50%{transform:translateY(-2%) scaleY(1.02)}}
.jc-ammit.eat img{animation:jcEat .7s cubic-bezier(.3,1.6,.5,1)}
@keyframes jcEat{25%{transform:translateX(-10%) scale(1.12) rotate(-6deg)}55%{transform:translateX(-4%) scale(.96) rotate(3deg)}}
.jc-ammit.sad img{filter:grayscale(.6) brightness(.7);transform:scale(.96)}
.jc-fly{position:absolute;z-index:8;width:44px;height:44px;pointer-events:none;transition:transform .7s cubic-bezier(.5,0,.4,1),opacity .7s}
.tc-act{--fs:clamp(18px,2.1vw,30px)}
@container (max-aspect-ratio:1/1){
  .jc-main{grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto minmax(0,1fr);align-items:stretch;gap:8px}
  .jc-anubis{grid-column:1;grid-row:1;height:auto;flex-direction:row;align-items:flex-end;gap:8px}
  .jc-anubis img{width:min(26cqw,18cqh);flex:none}
  .jc-say{position:relative;left:auto;right:auto;top:auto;flex:1;font-size:12px;align-self:center}
  .jc-ammit{grid-column:2;grid-row:1;justify-content:flex-end}
  .jc-ammit img{width:min(26cqw,17cqh)}
  .jc-center{grid-column:1/-1;grid-row:2;height:auto;min-height:0;justify-content:flex-start}
  .jc-code{max-height:none;font-size:clamp(11px,3.2cqw,14px)}
  .jc-scroll{overflow:auto}
  .jc-scale{width:110px}
}
`;

function create(stage,api){
  const C=window.TEMPLO_LIB.cartas,S=C.sounds(api),R=api.reduced,T=api.t;
  const root=C.mount(stage,CSS);
  const fmt=n=>Number(n).toLocaleString('es-ES');
  root.insertAdjacentHTML('beforeend',`<div class="jc-wrap"><div class="jc-deco"></div><div class="jc-main">
    <div class="jc-anubis" id="jc-anubis"><div class="jc-say" id="jc-say" role="status"></div></div>
    <div class="jc-center">
      <div class="jc-top"><span class="jc-lives" id="jc-lives" aria-label="${T('livesAria')}"></span><span class="jc-round" id="jc-round"></span><span class="jc-streak" id="jc-streak"></span>
        <svg class="jc-scale" viewBox="0 0 200 120" aria-hidden="true"><path d="M100 30V110M76 112H124" stroke="#0A0A08" stroke-width="7" stroke-linecap="round"/><path d="M100 30V110M76 112H124" stroke="#C9A227" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="26" r="7" fill="#F5C842" stroke="#0A0A08" stroke-width="2.5"/>
          <g class="jc-beam" id="jc-beam"><path d="M30 34H170" stroke="#0A0A08" stroke-width="7" stroke-linecap="round"/><path d="M30 34H170" stroke="#F5C842" stroke-width="4" stroke-linecap="round"/>
            <g class="jc-pan" id="jc-panL" style="transform-origin:30px 34px"><path d="M30 34L14 70M30 34L46 70" stroke="#C9A227" stroke-width="1.6"/><path d="M8 70Q30 86 52 70Z" fill="#C9A227" stroke="#0A0A08" stroke-width="2"/><svg x="19" y="47" width="22" height="22" viewBox="0 0 24 24">${HEART}</svg></g>
            <g class="jc-pan" id="jc-panR" style="transform-origin:170px 34px"><path d="M170 34L154 70M170 34L186 70" stroke="#C9A227" stroke-width="1.6"/><path d="M148 70Q170 86 192 70Z" fill="#C9A227" stroke="#0A0A08" stroke-width="2"/><svg x="158" y="44" width="24" height="24" viewBox="0 0 24 24">${FEATHER}</svg></g></g></svg></div>
      <div class="jc-scroll" id="jc-scroll"><div class="jc-meta"><span class="jc-lang" id="jc-lang"></span><span class="jc-q" id="jc-q"></span><span class="jc-timer"><i id="jc-tbar"></i></span></div>
        <ol class="jc-code" id="jc-code"></ol><div class="jc-why" id="jc-why" aria-live="polite"></div></div>
      <div class="jc-hint" id="jc-hint"></div>
    </div>
    <div class="jc-ammit idle" id="jc-ammit"></div>
  </div></div>`);
  const $=s=>root.querySelector(s);
  const say=$('#jc-say'),codeEl=$('#jc-code'),why=$('#jc-why'),tbar=$('#jc-tbar'),ammit=$('#jc-ammit'),anubis=$('#jc-anubis'),beam=$('#jc-beam'),panL=$('#jc-panL'),panR=$('#jc-panR');
  [['anubis-juez.webp',anubis],['ammit.webp',ammit]].forEach(([f,el])=>{const im=new Image();im.alt='';im.onload=()=>el.append(im);im.src=api.base+'juicio/'+f});
  const bar=C.acts(root,api);

  let deck,round,lives,score,streak,best,phase,gen=0,done=false,cur,selLine,t0,dur,raf=0,stats;
  function talk(t){say.textContent=t;say.style.animation='none';void say.offsetWidth;say.style.animation=''}
  function hud(){api.setScore(fmt(score)+' '+T('unit'));$('#jc-round').textContent=T('round').replace('{n}',Math.min(round+1,ROUNDS)).replace('{t}',ROUNDS);
    $('#jc-streak').textContent=streak>1?T('streak').replace('{n}',streak):'';
    $('#jc-lives').innerHTML=Array.from({length:LIVES},(_,i)=>'<svg viewBox="0 0 24 24" class="'+(i>=lives?'lost':'')+'">'+HEART+'</svg>').join('')}
  function tilt(a){beam.style.transform='rotate('+a+'deg)';panL.style.transform='rotate('+(-a)+'deg)';panR.style.transform='rotate('+(-a)+'deg)'}
  function buildDeck(){/* 12 almas con dificultad creciente, mezclando lenguajes y alternando limpias y con fallo */
    const sh=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
    const by=lv=>sh(SOULS.filter(s=>s.lv===lv));const l1=by(1),l2=by(2),l3=by(3);
    const plan=[1,1,1,1,2,2,2,2,2,3,3,3];const d=[];const used=new Set();
    plan.forEach(lv=>{const pool=lv===1?l1:lv===2?l2:l3;let s=pool.find(x=>!used.has(x)&&(!d.length||x.lang!==d[d.length-1].lang));if(!s)s=pool.find(x=>!used.has(x))||SOULS.find(x=>!used.has(x));used.add(s);d.push(s)});
    return d}
  function show(){const g=gen;cur=deck[round];selLine=-1;phase='judge';why.textContent='';
    $('#jc-lang').textContent=cur.lang.toUpperCase();$('#jc-q').textContent=T('question');
    codeEl.className='jc-code';codeEl.innerHTML=cur.code.map((l,i)=>'<li tabindex="0" data-i="'+i+'" aria-label="'+T('lineAria').replace('{n}',i+1)+'">'+(hl(l,cur.lang)||' ')+'</li>').join('');
    codeEl.querySelectorAll('li').forEach(li=>li.addEventListener('click',()=>{if(phase!=='judge')return;const i=+li.dataset.i;if(selLine===i){judge('bug',i);return}selLine=i;paintSel()}));
    const sc=$('#jc-scroll');sc.classList.remove('in');void sc.offsetWidth;if(!R)sc.classList.add('in');S.flip();
    tilt(0);ammit.className='jc-ammit idle';
    dur=(R?1.6:1)*Math.max(12,26-round*1.2)*1000;t0=performance.now();cancelAnimationFrame(raf);
    const tick=now=>{if(g!==gen||phase!=='judge')return;const left=Math.max(0,1-(now-t0)/dur);tbar.style.transform='scaleX('+left+')';tilt((1-left)*-6);
      if(left<=0){judge('timeout',-1);return}raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);
    $('#jc-hint').textContent=T('hint');setActs();hud()}
  function paintSel(){codeEl.querySelectorAll('li').forEach((li,i)=>li.classList.toggle('sel',i===selLine));S.tick();setActs()}
  function setActs(){if(phase!=='judge'){return}
    bar.set([{label:T('clean'),key:'l',on:()=>judge('clean',-1),alt:selLine>=0},
      {label:selLine>=0?T('accuse').replace('{n}',selLine+1):T('bug'),key:'f',on:()=>judge('bug',selLine)}])}
  function fly(svg,toEl,cb){const s=$('#jc-scroll').getBoundingClientRect(),t=toEl.getBoundingClientRect(),r=root.getBoundingClientRect();if(R||!t.width){cb&&cb();return}
    const f=document.createElement('div');f.className='jc-fly';f.innerHTML='<svg viewBox="0 0 24 24">'+svg+'</svg>';f.style.left=(s.left-r.left+s.width/2-22)+'px';f.style.top=(s.top-r.top+20)+'px';root.append(f);
    requestAnimationFrame(()=>{f.style.transform='translate('+((t.left+t.width*.3)-(s.left+s.width/2))+'px,'+((t.top+t.height*.35)-(s.top+20))+'px) scale(.6)';f.style.opacity='.2'});
    setTimeout(()=>{f.remove();cb&&cb()},720)}
  function judge(kind,line){if(phase!=='judge')return;const g=gen;phase='verdict';cancelAnimationFrame(raf);bar.set([]);
    const isBug=cur.bug>=0,left=Math.max(0,1-(performance.now()-t0)/dur);
    const right=(kind==='clean'&&!isBug)||(kind==='bug'&&isBug);
    codeEl.classList.add('locked');
    if(isBug){codeEl.children[cur.bug].classList.add('bad');if(kind==='bug'&&line>=0&&line!==cur.bug)codeEl.children[line].classList.add('wrong')}
    let gain=0,exact=false;
    if(right){streak++;best=Math.max(best,streak);stats.ok++;exact=isBug&&line===cur.bug;if(exact)stats.lines++;
      gain=Math.round((100+Math.round(left*100)+(exact?75:0))*(1+.25*Math.min(streak-1,4)));score+=gain;
      if(isBug){tilt(-18);ammit.className='jc-ammit eat';fly(HEART,ammit);setTimeout(()=>{api.tone(140,.12,'square',.07);api.noise(.18,300,1200,.08)},R?0:600);
        C.banner(root,api,exact?T('exact'):T('devoured'),'+'+fmt(gain)+' '+T('unit'),true);talk(exact?T('sayExact'):T('sayDevoured'))}
      else{tilt(0);ammit.className='jc-ammit sad';C.banner(root,api,T('saved'),'+'+fmt(gain)+' '+T('unit'),true);talk(T('saySaved'))}
      S.win()}
    else{streak=0;lives--;stats.ko++;anubis.classList.remove('angry');void anubis.offsetWidth;anubis.classList.add('angry');
      tilt(isBug?-18:12);ammit.className='jc-ammit '+(isBug?'sad':'eat');
      C.banner(root,api,kind==='timeout'?T('timeout'):T('wrong'),isBug?T('wasBug'):T('wasClean'));S.lose();talk(kind==='timeout'?T('sayTimeout'):T('sayWrong'))}
    why.innerHTML='<b class="'+(isBug?'ko':'ok')+'">'+(isBug?T('verdictBug').replace('{n}',cur.bug+1):T('verdictClean'))+'</b>'+cur.why.replace(/&/g,'&amp;').replace(/</g,'&lt;');
    hud();
    $('#jc-hint').textContent='';
    const last=round>=ROUNDS-1||lives<=0;
    setTimeout(()=>{if(g!==gen)return;phase='read';bar.set([{label:last?T('seeResult'):T('next'),key:'enter',keyLabel:'ENTER',keys:[' '],on:advance}])},R?200:900)}
  function advance(){if(phase!=='read')return;round++;if(lives<=0||round>=ROUNDS){finish();return}show()}
  function finish(){if(done)return;phase='end';bar.set([]);done=true;gen++;cancelAnimationFrame(raf);
    if(api.ach){api.ach('jc-first');if(stats.ko===0&&round>=ROUNDS)api.ach('jc-perfect');if(stats.lines>=5)api.ach('jc-lines')}
    api.finish({score,unit:T('unit'),ankhs:1+Math.floor(score/250),detail:T('detail').replace('{ok}',stats.ok).replace('{t}',stats.ok+stats.ko).replace('{l}',stats.lines).replace('{s}',best)})}

  const kd=e=>{if(done)return;
    if(phase==='judge'&&(e.key==='ArrowUp'||e.key==='ArrowDown')){e.preventDefault();const n=cur.code.length;selLine=selLine<0?(e.key==='ArrowDown'?0:n-1):(selLine+(e.key==='ArrowDown'?1:-1)+n)%n;paintSel();codeEl.children[selLine].scrollIntoView({block:'nearest'});return}
    bar.key(e)};
  addEventListener('keydown',kd);
  function start(){gen++;done=false;deck=buildDeck();round=0;lives=LIVES;score=0;streak=0;best=0;stats={ok:0,ko:0,lines:0};talk(T('welcome'));
    phase='intro';C.banner(root,api,T('introT'),T('introSub'));setTimeout(()=>{if(!done)show()},R?200:1300);hud()}
  start();
  return{restart:start,stop(){gen++;done=true;cancelAnimationFrame(raf);removeEventListener('keydown',kd);root.remove()}};
}
window.TEMPLO.register('juicio',{create,help:[
  {t:'OBJETIVO',p:'Anubis pesa el corazón de cada alma, que aquí es un fragmento de código. Tienes que decidir si es código limpio o si tiene un fallo. Son 12 almas y tienes 3 corazones.'},
  {t:'CÓMO JUZGAR',p:'LIMPIO: el código es correcto y el alma pasa al más allá. CON FALLO: el código tiene un error y Ammit se lo come. Si además tocas la línea exacta del fallo antes de acusar (o la tocas dos veces), ganas un bonus.'},
  {t:'PUNTOS',p:'Cada acierto da 100 puntos, más hasta 100 por rapidez y 75 por señalar la línea exacta. Encadenar aciertos multiplica los puntos hasta ×2. Un fallo o que se acabe el tiempo te quita un corazón.'},
  {t:'LENGUAJES',p:'JavaScript, Java, Python, SQL, C#, Kotlin y PHP. Los fallos son errores reales y típicos: índices fuera de rango, comparaciones mal hechas, nulos, consultas peligrosas… Después de cada juicio verás la explicación.'},
  {t:'TECLADO',p:'L: limpio · F: con fallo · ↑ ↓: señalar una línea · ← →: elegir botón · Enter: confirmar y pasar a la siguiente alma.'}],
texts:{
  unit:'pts',livesAria:'Corazones restantes',round:'ALMA {n}/{t}',streak:'RACHA ×{n}',question:'¿Código limpio o con fallo?',lineAria:'Línea {n}',
  hint:'Toca una línea para señalar el fallo, o juzga directamente.',clean:'LIMPIO',bug:'CON FALLO',accuse:'FALLO EN LA LÍNEA {n}',next:'SIGUIENTE ALMA',seeResult:'VER SENTENCIA',
  exact:'¡LÍNEA EXACTA!',devoured:'¡DEVORADO!',saved:'¡AL MÁS ALLÁ!',wrong:'JUICIO ERRÓNEO',timeout:'¡SE ACABÓ EL TIEMPO!',wasBug:'ESE CÓDIGO TENÍA UN FALLO',wasClean:'ESE CÓDIGO ERA CORRECTO',
  verdictBug:'FALLO EN LA LÍNEA {n}.',verdictClean:'ALMA LIMPIA.',
  introT:'¡QUE COMIENCE EL JUICIO!',introSub:'12 ALMAS · 3 CORAZONES',
  welcome:'«Cada línea de código deja huella en el corazón. Pésalas bien: Ammit tiene hambre.»',
  sayExact:'«Has visto el fallo exacto. Ojo de halcón.»',sayDevoured:'«Correcto. Ammit, a comer.»',saySaved:'«Un alma limpia. Que descanse en el más allá.»',
  sayWrong:'«Tu juicio ha sido injusto. Lee la sentencia.»',sayTimeout:'«La balanza no espera a nadie.»',
  detail:'{ok} de {t} juicios acertados · {l} líneas exactas · mejor racha ×{s}'}});
})();
