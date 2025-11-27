import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import 'text-encoding';

global.Buffer = Buffer;

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}