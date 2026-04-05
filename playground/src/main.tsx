import { createRoot } from 'react-dom/client';
import { Editor } from '@windoc/react';
import '@windoc/core/style.css';
import '@windoc/react/style.css';

const LOREM_IPSUM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse tincidunt et odio et mattis. Duis ac placerat nibh, at semper leo. Maecenas condimentum ultrices magna, at lacinia nunc accumsan ac. Curabitur finibus ut nibh eu efficitur. Proin interdum eget odio at semper. Vivamus lobortis leo a fermentum dignissim. Nullam eu volutpat urna, non gravida est. Mauris consectetur eros quis accumsan euismod. Nullam sed magna porttitor, facilisis velit id, ornare dolor. Donec semper nulla metus, sit amet placerat neque luctus at. Donec efficitur massa ut consequat tempus. Nam laoreet cursus massa, id placerat mauris fringilla nec. Ut quis accumsan massa, ut maximus sem. Proin consectetur diam nulla, ut vehicula lectus pretium a. Maecenas nec dictum ipsum.

Proin libero arcu, fringilla et velit blandit, porttitor tincidunt purus. Phasellus ullamcorper venenatis lectus, eget hendrerit ex. Morbi ac urna mi. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Donec accumsan metus erat, mattis egestas diam viverra sit amet. In eleifend arcu vel nibh placerat elementum. Donec placerat facilisis nunc et iaculis. Donec risus ligula, consectetur nec tincidunt eu, facilisis a dui.

Cras tincidunt sodales urna, quis efficitur sem bibendum quis. Donec euismod sagittis neque, at imperdiet arcu scelerisque et. Aliquam et mi nibh. Sed dignissim nisl et libero interdum congue. Mauris lobortis tempor dolor. Sed lacinia vestibulum massa vel blandit. Interdum et malesuada fames ac ante ipsum primis in faucibus. In vitae turpis vulputate, tempus lacus eu, malesuada turpis. Cras fermentum sit amet eros a feugiat. Praesent mattis odio sed lacinia dictum. Nunc commodo lectus vel nisl laoreet, sed convallis odio iaculis.

Ut rutrum quam nec lorem tempor, sit amet porttitor dui molestie. Phasellus a mattis lorem. Suspendisse eget justo nibh. Etiam vel rhoncus nisi. Curabitur luctus ullamcorper nibh, non aliquam risus fringilla non. Sed euismod accumsan dolor non ullamcorper. Praesent ac eros a metus luctus egestas. Curabitur laoreet pellentesque suscipit. Fusce ullamcorper nisi sit amet risus volutpat sollicitudin. Cras eu imperdiet sem, ac varius dolor. Morbi vitae placerat sapien. Donec et est erat. Sed porttitor in enim eget lobortis.

Morbi feugiat a est a faucibus. Curabitur non massa vitae augue scelerisque scelerisque at vitae nisi. Maecenas faucibus, tortor et aliquet porta, sapien felis hendrerit justo, et luctus ante dolor a mauris. In hac habitasse platea dictumst. Ut eleifend feugiat ornare. Nulla facilisi. Morbi in lectus nibh. Quisque eu nulla neque. Donec ullamcorper ex et dolor tristique, quis congue risus lacinia. Pellentesque pharetra, nunc nec varius interdum, ante arcu feugiat purus, ut mattis sem urna nec elit. Cras posuere, est id varius luctus, mauris mi ultrices nunc, at porta massa purus et eros. Morbi et velit suscipit, consectetur erat ut, pellentesque leo. Morbi eget neque est. Phasellus ac bibendum ipsum. Pellentesque aliquet ligula in elit iaculis, bibendum tempor dui venenatis. Sed eget iaculis est, et lacinia nibh.

Ut vitae rhoncus erat. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Curabitur felis orci, iaculis nec sollicitudin id, maximus eleifend ligula. Duis aliquet, dui sed porta sagittis, augue felis feugiat enim, nec pharetra est enim eu nunc. Mauris congue nisi a nisi ultricies, eget pulvinar nibh condimentum. Fusce consectetur tristique fringilla. Aliquam vel ex vitae diam elementum semper ac non massa. Ut eu aliquam eros. Duis porttitor erat ligula, id rhoncus ligula hendrerit eget. Mauris euismod hendrerit tellus. Phasellus ut dignissim ante. Vivamus euismod nisi neque, id aliquam dui eleifend vel.

Nullam nunc enim, eleifend sit amet faucibus sed, ullamcorper et nibh. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Fusce nec neque eget risus vulputate laoreet vel in est. Duis vestibulum quam ac placerat mattis. Sed non vestibulum massa, eget ultrices sapien. Quisque sed elit quis nibh eleifend efficitur eu nec ipsum. Fusce gravida a ex in tincidunt.

Nullam pharetra dolor lectus, quis porttitor odio tincidunt eget. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Ut vitae leo id nunc consequat varius. Vivamus vulputate fringilla auctor. Duis et tortor ut dolor fermentum imperdiet ac vitae nibh. Maecenas ac purus dapibus, posuere lorem et, accumsan turpis. Maecenas ut commodo augue. Pellentesque lobortis quis arcu non venenatis. Pellentesque commodo et dolor eu malesuada. Morbi euismod magna ut lacus convallis lobortis. Integer in gravida neque. Nunc sit amet magna ut nisl porttitor varius vel eu nisl.

Sed laoreet nec ante sed laoreet. Curabitur ultrices justo felis, sed sagittis erat euismod sed. Nullam volutpat non nulla et posuere. Phasellus sit amet felis eu nulla dapibus mattis. Donec laoreet magna a dolor pellentesque, at iaculis dolor maximus. Aliquam vitae bibendum mi, vitae consequat tortor. Nulla sed pellentesque nisi, eget euismod leo. Vestibulum ornare orci eu ex hendrerit ultricies. Donec pretium fermentum tortor, eu luctus ligula rhoncus ut. Pellentesque fermentum elit molestie libero varius, quis ullamcorper ante laoreet.

Mauris interdum ut metus semper condimentum. Fusce lobortis commodo sapien, vitae posuere nisi tristique non. Vivamus molestie libero non quam consequat lacinia. Nulla facilisi. Curabitur odio augue, molestie eu viverra in, ullamcorper lacinia lorem. Nunc lobortis congue lorem, at malesuada diam. Donec feugiat turpis ligula.

Cras luctus felis at lorem fermentum volutpat. Maecenas ullamcorper, ex euismod tincidunt consequat, justo purus tincidunt risus, ut facilisis elit dui a purus. Aliquam vitae venenatis lectus, sit amet euismod mi. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nam eleifend quam eu lectus pellentesque cursus. Nulla hendrerit finibus magna, ut dictum mi tristique vitae. Curabitur fringilla magna sagittis est faucibus ullamcorper. Aliquam hendrerit leo sed sollicitudin viverra. Donec imperdiet varius mi, vel sagittis lorem accumsan id. Nullam ac lectus tincidunt tortor ultrices ullamcorper sed in elit.

Sed rhoncus venenatis dolor in vehicula. Ut cursus varius volutpat. Etiam tortor ante, interdum vel fringilla eu, pulvinar vitae urna. Curabitur in faucibus sapien. In enim ligula, volutpat id porta sed, tempus et est. Suspendisse potenti. Fusce magna tellus, blandit euismod condimentum nec, ultrices quis massa. Vivamus pellentesque leo urna, eget lobortis dui ultricies eu. Vivamus vestibulum, nisl quis tempus mollis, nisl massa porttitor erat, et auctor augue lectus quis nisl. Nulla ut aliquam lorem. Fusce lobortis ultricies lectus rhoncus laoreet. Donec facilisis tristique nunc. In hac habitasse platea dictumst. Aliquam eu consequat risus.

Etiam lacinia ultrices mi eget mattis. Maecenas tempor felis in dolor cursus consequat. Quisque quam tellus, hendrerit in malesuada quis, placerat eu lorem. Maecenas quam urna, interdum ac orci id, varius mattis metus. Pellentesque eu massa nec arcu sagittis auctor. Nunc id lorem a turpis tincidunt interdum. Etiam tincidunt, nisi in mollis tincidunt, tellus quam luctus nulla, vel vestibulum dolor tortor non nunc. Sed erat massa, feugiat et ligula vel, consectetur rhoncus justo. Maecenas viverra purus at leo fringilla, a consequat felis tristique. Sed sem velit, pharetra et molestie id, porttitor eu est. Nunc erat risus, tincidunt nec nisl vitae, molestie dictum enim. Morbi et ex libero. Cras arcu massa, semper eget turpis in, facilisis consectetur urna.

Aenean non eros sit amet magna scelerisque suscipit ut eleifend nisi. Mauris porttitor justo eget urna ultrices, non euismod odio pellentesque. Etiam ut dignissim arcu. Nam mattis nec nulla euismod dignissim. Cras non ante ac neque eleifend tincidunt. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec eleifend lacus turpis, eu dapibus arcu consequat vel. Curabitur eget leo quam. Praesent pulvinar malesuada justo eu fermentum. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Pellentesque enim velit, viverra at laoreet et, feugiat a quam.

Maecenas interdum nisi nec ipsum lacinia, nec convallis enim semper. Fusce interdum justo ac efficitur congue. Morbi posuere elit nec leo mollis condimentum. Sed commodo bibendum ipsum ac pulvinar. Fusce dapibus iaculis consequat. Aliquam iaculis velit ligula, id molestie ex vehicula a. Nunc id nulla at quam eleifend efficitur sit amet vitae lacus. Fusce risus enim, lobortis nec leo id, auctor vehicula odio. Phasellus et ex est. Quisque non leo tincidunt, porttitor erat ac, convallis nisl. Sed pharetra sapien vitae porta ullamcorper.

Nullam pulvinar finibus risus id imperdiet. Aenean laoreet, neque elementum pellentesque venenatis, ipsum sapien facilisis dolor, vitae consequat tortor neque eu tortor. Quisque magna elit, finibus vitae facilisis et, varius a urna. Vestibulum pulvinar vel ligula id vestibulum. Fusce tincidunt hendrerit augue sit amet hendrerit. Nulla tempor id sapien in pellentesque. Aenean sit amet felis tortor. Vivamus ante nisl, venenatis vitae eros id, bibendum elementum ipsum.

Maecenas vel nunc ante. Nulla suscipit, metus sed condimentum faucibus, nisl est commodo dolor, sed vehicula elit lacus nec ligula. Quisque et consectetur est. Integer gravida dolor eros, nec feugiat magna rutrum vel. Maecenas elit nibh, dapibus eu mauris at, convallis varius lacus. Phasellus id posuere nunc. Aliquam suscipit nunc in tellus rhoncus, sit amet sodales enim faucibus. Aliquam erat volutpat. Vivamus bibendum euismod purus, id pellentesque quam tristique eget.

saya mau test`;

const ZERO = '\u200B';

function textToElements(text: string): Array<{ value: string }> {
  const elements: Array<{ value: string }> = [];
  const paragraphs = text.split('\n\n');
  paragraphs.forEach((para, i) => {
    if (i > 0) elements.push({ value: ZERO });
    for (const char of para) {
      elements.push({ value: char === '\n' ? ZERO : char });
    }
  });
  return elements;
}

function App() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Editor
        options={{
          placeholder: { data: 'Start typing...' },
          zone: { tipDisabled: false },
          scale: 1.2,
          margins: [21, 21, 21, 21],
          header: { top: 19 }
        }}
        onReady={(editor: any) => {
          editor.command.executeSetValue({ main: textToElements(LOREM_IPSUM) });
        }}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
