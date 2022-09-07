export default class ErrorMsg {
    static filterRevertMsg(msg: string): string {
        let indexStart = msg.indexOf(`(reason="`);
        if(indexStart === -1) {
            return msg;
        } 
        
        indexStart += 9;
        let indexEnd = msg.indexOf(`", method=`);
        return msg.slice(indexStart, indexEnd);
    }
}